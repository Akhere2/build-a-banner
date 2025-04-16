import React, { useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Text as KonvaText, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { useImage } from "react-konva-utils";

export default function LandingPage() {
  const stageRef = useRef();
  const [tool, setTool] = useState("brush");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [color, setColor] = useState("black");
  const [lines, setLines] = useState([]);
  const [segments, setSegments] = useState([]); // store individual segments of lines for partial erase
  const isDrawing = useRef(false);
  const [image, setImage] = useState(null);
  const [uploadedImage] = useImage(image);

  // Handle mouse down for drawing or creating new shapes
  const handleMouseDown = (e) => {
    if (tool === "brush" || tool === "erase") {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, { tool, points: [pos.x, pos.y], stroke: color }]);
    }
    if (tool === "circle" || tool === "square" || tool === "triangle" || tool === "line") {
      const pos = e.target.getStage().getPointerPosition();
      let newShape = {
        tool,
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 100,
        fill: color,
        stroke: "black",
        strokeWidth: 2,
      };

      if (tool === "circle") {
        newShape.radius = 50;
      } else if (tool === "triangle") {
        newShape.points = [0, 0, 100, 0, 50, 100];
      }

      setElements([...elements, newShape]);
    }

    if (tool === "text") {
      const pos = e.target.getStage().getPointerPosition();
      const newText = {
        tool,
        x: pos.x,
        y: pos.y,
        text: "Your text here",
        fontSize: 20,
        fontFamily: "Arial",
        fill: color,
      };
      setElements([...elements, newText]);
    }
  };

  // Handle mouse move for drawing or erasing
  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (tool === "brush") {
      let lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    }

    if (tool === "erase") {
      let newSegments = [...segments];
      const eraserRadius = 20; // Eraser radius to detect which segments to erase

      lines.forEach((line, index) => {
        // Break the line into smaller segments
        for (let i = 0; i < line.points.length - 2; i += 2) {
          const x1 = line.points[i];
          const y1 = line.points[i + 1];
          const x2 = line.points[i + 2];
          const y2 = line.points[i + 3];

          const distance = distanceToSegment(x1, y1, x2, y2, point.x, point.y);
          if (distance < eraserRadius) {
            // If the distance is less than the eraser radius, mark the segment for removal
            newSegments = newSegments.filter((seg) => !(seg.x1 === x1 && seg.y1 === y1 && seg.x2 === x2 && seg.y2 === y2));
          } else {
            // Otherwise, keep the segment
            newSegments.push({ x1, y1, x2, y2 });
          }
        }
      });

      setSegments(newSegments);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Utility function to calculate the distance between a point and a segment
  const distanceToSegment = (x1, y1, x2, y2, px, py) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    const t = ((px - x1) * dx + (py - y1) * dy) / (length * length);
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  };

  // Undo the last drawn line
  const handleUndo = () => {
    if (lines.length === 0) return;
    const newHistory = [...lines];
    newHistory.pop(); // remove the last line
    setLines(newHistory);
  };

  // Image upload handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  // Add canvas content to cart (as an image)
  const handleAddToCart = () => {
    const uri = stageRef.current.toDataURL();
    const price = 20; // TBD pricing logic
    localStorage.setItem("cartItem", JSON.stringify({ image: uri, price }));
    alert("Canvas added to cart!");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        {["brush", "erase", "text", "circle", "square", "triangle", "line"].map((t) => (
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
              stroke={tool === "erase" ? "white" : line.stroke}
              strokeWidth={tool === "erase" ? 20 : 2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={tool === "erase" ? "destination-out" : "source-over"}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
