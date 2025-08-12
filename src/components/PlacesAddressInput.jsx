// components/PlacesAddressInput.jsx
import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const loader = new Loader({
  apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_PLACES_API,
  version: "weekly",
  libraries: ["places"],
});

function placeToJson(place) {
  return {
    place_id: place.place_id,
    formatted_address: place.formatted_address,
    address_components: place.address_components,
    lat: place.geometry?.location?.lat?.(),
    lng: place.geometry?.location?.lng?.(),
  };
}

export default function PlacesAddressInput({
  value, // optional existing JSON object
  onChange, // receives the JSON object
  placeholder = "Start typing your address…",
  restrictCountry, // e.g. "us" or ["us","ca"]
  className = "",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    let autocomplete;
    let mounted = true;

    loader.load().then(() => {
      if (!mounted || !inputRef.current || !window.google) return;

      const opts = {
        types: ["address"],
        ...(restrictCountry
          ? { componentRestrictions: { country: restrictCountry } }
          : {}),
      };

      autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        opts
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.place_id) return;
        onChange?.(placeToJson(place));
      });
    });

    return () => {
      mounted = false;
    };
  }, [restrictCountry, onChange]);

  return (
    <input
      ref={inputRef}
      defaultValue={value?.formatted_address || ""}
      placeholder={placeholder}
      className={
        className ||
        "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
      }
      autoComplete="off"
    />
  );
}
