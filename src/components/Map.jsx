import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom red icon for user's location
const hospitalIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const NearbyHospitalsOSM = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => console.error("Location access denied")
    );
  }, []);

  useEffect(() => {
    if (location) {
      const hospitalsData = [
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
        {
          id: 3,
          lat: location.lat + 0.004,
          lon: location.lng - 0.002,
          name: "Dr. Nitin Amale Hospital",
          distance: "~1.5 km",
          cashless: true,
          cost: "₹6000",
        },
        {
          id: 4,
          lat: location.lat - 0.004,
          lon: location.lng + 0.002,
          name: "Suman Kanta Hospital",
          distance: "~1.8 km",
          cashless: false,
          cost: "₹4000",
        },
        {
          id: 5,
          lat: location.lat + 0.003,
          lon: location.lng - 0.003,
          name: "Shree Sai Multispeciality Hospital",
          distance: "~1.2 km",
          cashless: true,
          cost: "₹5500",
        },
        {
          id: 6,
          lat: location.lat + 0.006,
          lon: location.lng - 0.002,
          name: "Kalpataru Hospital & Maternity Clinic",
          distance: "~1.6 km",
          cashless: false,
          cost: "₹4200",
        },
        {
          id: 7,
          lat: location.lat - 0.003,
          lon: location.lng + 0.004,
          name: "Children's Hospital",
          distance: "~2.5 km",
          cashless: true,
          cost: "₹4800",
        },
        {
          id: 8,
          lat: location.lat - 0.006,
          lon: location.lng - 0.004,
          name: "Polaris Hospital",
          distance: "~3 km",
          cashless: true,
          cost: "₹5100",
        },
        {
          id: 9,
          lat: location.lat + 0.005,
          lon: location.lng + 0.003,
          name: "Anjani Maternity and Nursing Home",
          distance: "~2 km",
          cashless: false,
          cost: "₹3200",
        },
      ];
      setHospitals(hospitalsData);
    }
  }, [location]);

  return (
    <div>
      {location ? (
        <MapContainer
          center={location}
          zoom={15}
          style={{ height: "220px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* User's location marker as a red dot */}
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
