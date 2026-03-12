import { useEffect, useState } from "react";
import CreateJoin from "./CreateJoin";
import RoomView from "./RoomView";

export default function App() {
  const [code, setCode] = useState(() => {
    const hash = window.location.hash.replace("#", "").trim();
    return hash || null;
  });

  useEffect(() => {
    function onHash() {
      const h = window.location.hash.replace("#", "").trim();
      setCode(h || null);
    }

    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!code) {
    return <CreateJoin onEnterRoom={(c) => (window.location.hash = c)} />;
  }

  return <RoomView code={code} onExit={() => (window.location.hash = "")} />;
}
