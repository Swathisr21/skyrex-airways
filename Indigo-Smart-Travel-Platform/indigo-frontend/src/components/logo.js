import React from "react";

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img 
        src="/logo.png" 
        alt="SkyRex Airways"
        style={{ height: "45px" }}
      />
      <h2 style={{ margin: 0, color: "#4fc3f7" }}>
        SkyRex Airways
      </h2>
    </div>
  );
}

export default Logo;