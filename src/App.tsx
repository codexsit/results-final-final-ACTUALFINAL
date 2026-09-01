import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import "./App.css";

const GRID_SIZE = 3;

function App() {
  const [pieces, setPieces] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showText, setShowText] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let shuffled;
    do {
      shuffled = Array.from(
        { length: GRID_SIZE * GRID_SIZE },
        (_, i) => i
      ).sort(() => Math.random() - 0.5);
    } while (
      shuffled.every((piece, index) => piece === index) ||
      shuffled.some((piece, index) => piece === index)
    );
    setPieces(shuffled);
  }, []);

  useEffect(() => {
    const correctPieces = pieces.filter(
      (piece, index) => piece === index
    ).length;
    setProgress(Math.round((correctPieces / (GRID_SIZE * GRID_SIZE)) * 100));
  }, [pieces]);

  const handleDrop = (fromIndex: number, toIndex: number) => {
    if (pieces[toIndex] === toIndex) return;
    const newPieces = [...pieces];
    [newPieces[fromIndex], newPieces[toIndex]] = [
      newPieces[toIndex],
      newPieces[fromIndex],
    ];
    setPieces(newPieces);

    if (newPieces.every((piece, index) => piece === index)) {
      setSolved(true);
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setShowMessage(true);
        // Show text 1 second after video appears
        setTimeout(() => {
          setShowText(true);
          // Redirect 3 seconds after text appears
          setTimeout(() => {
            window.location.href =
              "https://docs.google.com/spreadsheets/d/1ku3muf10AUSagq1LCeY5c8uurwr0Yixov0Kb5NCWO3I/edit?usp=sharing";
          }, 3000);
        }, 1000);
      }, 3000);
    }
  };

  const handleTileClick = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      handleDrop(selectedIndex, index);
      setSelectedIndex(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (pieces[index] !== index) {
      e.dataTransfer.setData("text/plain", index.toString());
      const target = e.currentTarget as HTMLElement;
      target.classList.add("dragging");
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("dragging");
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (pieces[index] === index) return; // Can't drag correct pieces

    e.preventDefault();
    setDraggingIndex(index);
    const target = e.currentTarget as HTMLElement;
    draggedElementRef.current = target;
    target.classList.add("dragging");

    // Store initial touch position for better UX
    const touch = e.touches[0];
    target.dataset.startX = touch.clientX.toString();
    target.dataset.startY = touch.clientY.toString();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (draggingIndex === null || !draggedElementRef.current) return;

    const touch = e.touches[0];
    const element = draggedElementRef.current;

    // Get initial position
    const startX = parseFloat(element.dataset.startX || "0");
    const startY = parseFloat(element.dataset.startY || "0");

    // Calculate offset
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Apply transform to show visual dragging
    element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (draggingIndex === null || !draggedElementRef.current) return;

    e.preventDefault();
    const element = draggedElementRef.current;
    element.classList.remove("dragging");
    element.style.transform = "";

    // Get the element under the touch point
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    ) as HTMLElement;

    // Find the puzzle piece element (could be the element itself or a parent)
    let puzzlePieceElement = elementBelow;
    while (
      puzzlePieceElement &&
      !puzzlePieceElement.classList.contains("puzzle-piece")
    ) {
      puzzlePieceElement = puzzlePieceElement.parentElement as HTMLElement;
    }

    if (
      puzzlePieceElement &&
      puzzlePieceElement.classList.contains("puzzle-piece")
    ) {
      // Get the index of the drop target
      const puzzleContainer = puzzlePieceElement.parentElement;
      if (puzzleContainer) {
        const dropIndex = Array.from(puzzleContainer.children).indexOf(
          puzzlePieceElement
        );
        if (dropIndex !== -1 && pieces[dropIndex] !== dropIndex) {
          handleDrop(draggingIndex, dropIndex);
        }
      }
    }

    setDraggingIndex(null);
    draggedElementRef.current = null;
  };

  return (
    <>
      <div className="logo-container">
        <a
          href="https://codexsit.github.io/CodeX-Website/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="media/logo.png" alt="Club Logo" className="club-logo" />
        </a>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      {showMessage ? (
        <div
          className="message-container"
          onClick={(e) => {
            const videoElement = e.currentTarget.querySelector("video");
            if (videoElement) {
              videoElement.muted = false;
              videoElement.play().catch((err) => {
                console.warn("Playbook failed after user interaction:", err);
              });
            }
          }}
        >
          <video
            src="media\get_trumputinned_lol.mp4"
            autoPlay
            loop
            className="video-message"
          >
            Your browser does not support the video tag.
          </video>
          {showText && <div className="oops-text">oops, wrong code</div>}
        </div>
      ) : (
        <div className="puzzle-container">
          {pieces.map((piece, index) => (
            <div
              key={index}
              className={`puzzle-piece ${piece === index ? "correct" : ""} ${
                selectedIndex === index ? "selected" : ""
              } ${draggingIndex === index ? "dragging" : ""}`}
              draggable={!solved && piece !== index}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                handleDrop(Number(e.dataTransfer.getData("text")), index)
              }
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => handleTileClick(index)}
              style={{
                backgroundImage: `url('media/deadpool-logan.gif')`,
                backgroundPosition: `${(piece % GRID_SIZE) * -100}% ${
                  Math.floor(piece / GRID_SIZE) * -100
                }%`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default App;
