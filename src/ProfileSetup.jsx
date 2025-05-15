import React, { useState } from "react";
import { storage, db, auth } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

export default function ProfileSetup({ user, onProfileSet }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let photoURL = "";
    if (photo) {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, photo);
      photoURL = await getDownloadURL(storageRef);
    }
    await setDoc(doc(db, "profiles", auth.currentUser.uid), {
      name,
      photoURL,
      userType: user
    });
    setLoading(false);
    onProfileSet({ name, photoURL });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "auto", textAlign: "center" }}>
      <h2>Configura tu perfil</h2>
      <input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ marginBottom: 10, width: "100%" }}
      />
      <br />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        required
        style={{ marginBottom: 10 }}
      />
      <br />
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}