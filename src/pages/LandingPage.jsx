import React, { useRef, useState } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import { useImage } from "react-konva-utils";

export default function LandingPage() {
  const stageRef = useRef();
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("black");
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const isDrawing = useRef(false);
  const [image, setImage] = useState(null);
  const [uploadedImage] = useImage(image);

  const handleMouseDown = (e) => {
    if (tool !== "brush") return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y], stroke: color }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== "brush") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setHistory([...history, [...lines]]);
  };

  const handleUndo = () => {
    if (lines.length === 0) return;
    const newHistory = [...history];
    const previous = newHistory.pop();
    setLines(previous || []);
    setHistory(newHistory);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const uri = stageRef.current.toDataURL();
    const price = 20; // TBD logic for pricing
    localStorage.setItem("cartItem", JSON.stringify({ image: uri, price }));
    alert("Canvas added to cart!");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTool("brush")}
          className={`px-4 py-2 rounded border transition-colors ${
            tool === "brush" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          brush
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded border"
        />

        <input type="file" onChange={handleImageUpload} />

        <button
          onClick={handleUndo}
          className="px-4 py-2 rounded border bg-yellow-300 hover:bg-yellow-400"
        >
          Undo
        </button>

        <button
          onClick={handleAddToCart}
          className="px-4 py-2 rounded border bg-green-500 text-white hover:bg-green-600"
        >
          Add to Cart
        </button>
      </div>

      <Stage
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        className="border border-gray-400"
      >
        <Layer>
          {uploadedImage && <KonvaImage image={uploadedImage} x={0} y={0} width={800} height={600} />}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
