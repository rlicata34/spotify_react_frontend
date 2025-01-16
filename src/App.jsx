require('dotenv').config();
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [activeModal, setActiveModal] = useState("");
  const [songId, setSongId] = useState("");
  const [songs, setSongs] = useState([]);
  const [accessToken, setAccessToken] = useState("");

  const baseUrl = "https://api.spotify.com";
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  // 33U1XjEJ7XohigE7QXCFIT

  // Fetch all saved songs from the backend
  const fetchSavedSongs = () => {
    fetch("http://localhost:4001/api/songs")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching saved songs: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setSongs(data); // Populate the `songs` state with saved songs
      })
      .catch((error) => {
        console.error("Failed to fetch saved songs:", error);
      });
  };

  // Fetch saved songs when the component mounts
  useEffect(() => {
    fetchSavedSongs();
  }, []);
  
  const fetchAccessToken = () => {
    const authUrl = "https://accounts.spotify.com/api/token";

    return fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch access token: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAccessToken(data.access_token);
        return data.access_token;
      })
      .catch((error) => {
        console.error("Error fetching access token:", error);
      });
  };

  const addNewSong = (name, artist, songId) => {
    return fetch("http://localhost:4001/api/songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        artist: artist,
        songId: songId,
      }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Error saving song: ${response.statusText}`);
      }
      return response.json();
    });
  };
  

  const closeActiveModal = () => {
    setActiveModal("");
  };

  const handleAddSongClick = () => {
    setActiveModal("add-song");
  };

  const handleSongIdChange = (e) => {
    setSongId(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const getToken = accessToken ? Promise.resolve(accessToken) : fetchAccessToken();

    getToken
      .then((token) => {
        return fetch(`${baseUrl}/v1/tracks/${songId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching track: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const newSong = {
          id: songId,
          name: data.name,
          artist: data.artists.map((artist) => artist.name).join(", "),
        };

        // Use addNewSong function to save to the database
      return addNewSong(newSong.name, newSong.artist, newSong.id).then(() => newSong);
      })
      .then((newSong) => {
        setSongs((prevSongs) => [...prevSongs, newSong]);
        setSongId(""); // Clear input field
        closeActiveModal();
      })
      .catch((error) => {
        console.error("Failed to fetch song:", error);
      });
  };

  const isOpen = activeModal === "add-song";

  return (
    <div className="page">
      <div className="page__content">
        <h1 className="page__title">Spotify Songs</h1>
        <button
          className="page__add-song-button"
          type="button"
          onClick={handleAddSongClick}
        >
          Add Song
        </button>
        <ul className="song__list">
          {songs.map((song, index) => (
            <li className="song" key={index}>
              <h2 className="song__name">{song.name}</h2>
              <p className="song__artist">{song.artist}</p>
              <iframe
                src={`https://open.spotify.com/embed/track/${song.songId}`}
                width="300"
                height="80"
                allow="encrypted-media"
                title={song.name}
              ></iframe>
            </li>
          ))}
        </ul>
        <div className={`modal ${isOpen ? "modal_opened" : ""}`}>
          <div className="modal__content">
            <h2 className="modal__title">Add Song</h2>
            <button
              className="modal__close"
              type="button"
              onClick={closeActiveModal}
            ></button>
            <form className="modal__form" onSubmit={handleFormSubmit}>
              <label className="modal__label">
                Song Id
                <input
                  type="text"
                  className="modal__input"
                  placeholder="Id for song"
                  value={songId}
                  onChange={handleSongIdChange}
                />
              </label>
              <button className="modal__submit-button" type="submit">
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;