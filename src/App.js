import { useEffect, useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState({});
  const [location, setLocation] = useState("");

  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchWeather() {
        try {
          if (query.length < 2) {
            setWeather({});
            return;
          }

          // API CALL 1
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error("Something went wrong at API call1");

          const data = await res.json();
          const { latitude, longitude, timezone, name, country_code } =
            data?.results?.at(0);

          setLocation(name + `${convertToFlag(country_code)}`);

          // API CALL 2
          const res2 = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          if (!res2.ok) throw new Error("Something went wrong at API call2");

          const data2 = await res2.json();

          setWeather(data2.daily);
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error(err);
        }
      }
      fetchWeather();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <div className="app">
      <h1>Functional Classy weather</h1>

      <input
        type="text"
        placeholder="Search for location"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {weather?.weathercode?.length && (
        <>
          <h1>Weather {location}</h1>
          <ul className="weather">
            {dates.map((date, i) => (
              <Weather
                max={max.at(i)}
                min={min.at(i)}
                date={dates.at(i)}
                code={codes.at(i)}
                isToday={i === 0}
                key={date}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Weather({ min, max, date, code, isToday }) {
  return (
    <li className="day">
      <span>{getIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {min}&deg; &mdash; {max}&deg;
      </p>
    </li>
  );
}

function getIcon(code) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(code));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
