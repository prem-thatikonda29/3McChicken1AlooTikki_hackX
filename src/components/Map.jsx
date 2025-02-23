import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom hospital icon
const hospitalIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Helper component to update the map center when `location` changes
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, 15);
  return null;
};

const NearbyHospitalsOSM = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const mapRef = useRef(null); // Store map instance to prevent multiple initializations

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => console.error("Location access denied")
    );
  }, []);

  useEffect(() => {
    if (location) {
      setHospitals([
        {
          id: 1,
          lat: location.lat + 0.005,
          lon: location.lng + 0.005,
          name: "Al Shifa Multi Speciality Hospital",
          distance: "~1 km",
          cashless: true,
          cost: "₹5000",
        },
        {
          id: 2,
          lat: location.lat - 0.005,
          lon: location.lng - 0.005,
          name: "Ayesha Hospital",
          distance: "~2 km",
          cashless: false,
          cost: "₹3500",
        },
      ]);
    }
  }, [location]);

  return (
    <div>
      {location ? (
        <MapContainer
          center={location}
          zoom={15}
          style={{
            height: "220px",
            width: "100%",
            borderRadius: "8px",
          }}
          whenCreated={(mapInstance) => {
            if (!mapRef.current) {
              mapRef.current = mapInstance; // Store only the first instance
            }
          }}
        >
          <ChangeView center={location} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* User's location marker */}
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={8}
            color="red"
            fillColor="red"
            fillOpacity={1}
          >
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </CircleMarker>

          {/* Hospital markers */}
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={[hospital.lat, hospital.lon]}
              icon={hospitalIcon}
            >
              <Popup>
                <strong>{hospital.name}</strong>
                <br />
                Distance: {hospital.distance}
                <br />
                Cashless Available:{" "}
                <strong>{hospital.cashless ? "Yes" : "No"}</strong>
                <br />
                Avg. Expenditure Cost:{" "}
                <strong
                  style={{
                    color:
                      parseInt(hospital.cost.replace("₹", ""), 10) > 4000
                        ? "red"
                        : "black",
                  }}
                >
                  {hospital.cost}
                </strong>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <p>Loading location...</p>
      )}
    </div>
  );
};

export default NearbyHospitalsOSM;
