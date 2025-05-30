import "../styles/LandingPage.css";
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import { useImage } from "react-konva-utils";
import { useNavigate, useParams } from "react-router-dom"; 
import axios from "axios";

export default function LandingPage() {
  const { sessionId } = useParams(); // Access the sessionId from the route
  const stageRef = useRef();
  const [tool, setTool] = useState("brush");
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(2);
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const [image, setImage] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [uploadedImage] = useImage(image);

  const navigate = useNavigate(); 

  // Redirect to login if not logged in or if sessionId doesn't match
  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    if (!storedSessionId || storedSessionId !== sessionId) {
      alert("Invalid session. Redirecting to login.");
      navigate("/login"); 
    }
  }, [sessionId, navigate]);

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (tool === "line") {
      setStartPoint(pos);
    } else if (tool === "brush" || tool === "erase") {
      isDrawing.current = true;
      setLines([...lines, { tool, points: [pos.x, pos.y], stroke: color, size: brushSize }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || (tool !== "brush" && tool !== "erase")) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (tool === "line" && startPoint) {
      const newLine = {
        tool: "line",
        points: [startPoint.x, startPoint.y, pos.x, pos.y],
        stroke: color,
        size: brushSize,
      };
      setLines([...lines, newLine]);
      setStartPoint(null);
      setHistory([...history, [...lines, newLine]]);
      setRedoHistory([]);
    } else {
      isDrawing.current = false;
      setHistory([...history, [...lines]]);
      setRedoHistory([]);
    }
  };

  const handleUndo = () => {
    if (lines.length === 0) return;
    const newHistory = [...history];
    const previous = newHistory.pop();
    setRedoHistory([lines, ...redoHistory]);
    setLines(previous || []);
    setHistory(newHistory);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[0];
    const newRedoHistory = redoHistory.slice(1);
    setHistory([...history, next]);
    setLines(next);
    setRedoHistory(newRedoHistory);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async () => {
    const uri = stageRef.current.toDataURL();
    const price = 20;
    const email = localStorage.getItem("userEmail");
  
    if (!email) {
      alert("User not logged in. Please log in to add to cart.");
      return;
    }
  
    try {
      await axios.post("/.netlify/functions/addToCart", {
        email,
        image: uri,
        price,
      });
      alert("Canvas added to cart in database!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart.");
    }
  };

  const handleViewCart = () => {
    navigate("/cart/" + sessionId); // Pass sessionId to the cart page
  };

  // Handle user logout
  const handleLogout = () => {
    // Clear session data from localStorage
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userEmail"); // updated
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="title-container flex items-center gap-2">
        <img src="../build-a-banner-logo.png" alt="Logo" className="logo" />
        <h1 className="title">Build-a-Banner</h1>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {["brush", "erase", "line"].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-4 py-2 rounded border transition-colors ${
              tool === t ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded border"
        />

        <div className="flex items-center gap-2">
          <label htmlFor="brushSize">Brush Size</label>
          <input
            type="range"
            id="brushSize"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span>{brushSize}</span>
        </div>

        <input type="file" onChange={handleImageUpload} />

        <button
          onClick={handleUndo}
          className="px-4 py-2 rounded border bg-yellow-300 hover:bg-yellow-400"
        >
          Undo
        </button>

        <button
          onClick={handleRedo}
          className="px-4 py-2 rounded border bg-purple-300 hover:bg-purple-400"
        >
          Redo
        </button>

        <button
          onClick={handleAddToCart}
          className="px-4 py-2 rounded border bg-green-500 text-white hover:bg-green-600"
        >
          Add to Cart
        </button>

        <button
          onClick={handleViewCart}
          className="px-4 py-2 rounded border bg-indigo-500 text-white hover:bg-indigo-600"
        >
          View Cart
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded border bg-red-500 text-white hover:bg-red-600"
        >
          Log Out
        </button>
      </div>

      <Stage
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        className="Stage"
      >
        <Layer>
          {uploadedImage && (
            <KonvaImage image={uploadedImage} x={0} y={0} width={800} height={600} />
          )}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === "erase" ? "white" : line.stroke}
              strokeWidth={line.size || 2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={
                line.tool === "erase" ? "destination-out" : "source-over"
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}



