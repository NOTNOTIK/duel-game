import React, { useRef, useEffect, useState } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const Hero = {
  RADIUS: 15,
  Y_SPEED: 2,
};

const Bullet = {
  RADIUS: 5,
  SPEED: 5,
};

function App() {
  const canvasRef = useRef(null);
  const [heroes, setHeroes] = useState([
    { x: 100, y: 300, color: 'red', direction: 1, score: 0, bulletColor: 'blue', shootRate: 1000, movingSpeed: Hero.Y_SPEED },
    { x: 700, y: 300, color: 'blue', direction: 1, score: 0, bulletColor: 'green', shootRate: 1000, movingSpeed: Hero.Y_SPEED },
  ]);
  const [bullets, setBullets] = useState([]);
  const [isGameActive, setIsGameActive] = useState(true);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: null, y: null });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleHeroChange = (index, changes) => {
    setHeroes((prev) => {
      const newHeroes = [...prev];
      newHeroes[index] = { ...newHeroes[index], ...changes };
      return newHeroes;
    });
  };

  const shootBullet = (index) => {
    const newBullets = [...bullets];
    const hero = heroes[index];
    newBullets.push({ 
      x: hero.x + (hero.color === 'red' ? Hero.RADIUS : -Hero.RADIUS), 
      y: hero.y, 
      direction: hero.color === 'red' ? 1 : -1, 
      color: hero.bulletColor,
      shooterIndex: index 
    });
    setBullets(newBullets);
  };

  const checkCollisions = () => {
    setBullets((prevBullets) => {
      
      return prevBullets.filter((bullet) => {
        let hit = false;

        heroes.forEach((hero, heroIndex) => {
          if (bullet.shooterIndex === heroIndex) return;
          const dx = bullet.x - hero.x;
          const dy = bullet.y - hero.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < Bullet.RADIUS + Hero.RADIUS) {
            hit = true;
            setHeroes(prevHeroes => {
              const newHeroes = [...prevHeroes];
              newHeroes[bullet.shooterIndex].score += 1;
              return newHeroes;
            });
          }
        });
        return !hit;
      });
    });
  };

  const update = () => {
    if (!isGameActive) return;
  
    const cursorBuffer = 30;
  
    setHeroes((prev) => 
      prev.map((hero, index) => {
        const dx = cursorPosition.x - hero.x;
        const dy = cursorPosition.y - hero.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        let newDirection = hero.direction;
  
        if (distance < cursorBuffer) {
          newDirection = -hero.direction;
        }
  
        const newY = Math.max(0, Math.min(CANVAS_HEIGHT, hero.y + newDirection * hero.movingSpeed));
        const direction = newY === 0 || newY === CANVAS_HEIGHT ? -newDirection : newDirection;
        return { ...hero, y: newY, direction };
      })
    );
  
    setBullets((prev) => {
      const newBullets = [];
      prev.forEach(bullet => {
        bullet.x += bullet.direction * Bullet.SPEED;
  
        if (bullet.x > 0 && bullet.x < CANVAS_WIDTH) {
          newBullets.push(bullet);
        }
      });
      return newBullets;
    });
  
    checkCollisions();
  };

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      heroes.forEach(hero => {
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, Hero.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = hero.color;
        ctx.fill();
      });

      bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, Bullet.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
      });

      requestAnimationFrame(render);
    };

    const interval = setInterval(() => {
      update();
    }, 16);

    render();
    return () => clearInterval(interval);
  }, [heroes, bullets, isGameActive]);

  const handleHeroClick = (index) => {
    setSelectedHeroIndex(index);
  };
  
  const handleColorChange = (color) => {
    handleHeroChange(selectedHeroIndex, { bulletColor: color });
    setSelectedHeroIndex(null);
  };

  const handleShootRateChange = (event) => {
    const shootRate = Number(event.target.value);
    handleHeroChange(selectedHeroIndex, { shootRate });
  };

  const handleSpeedChange = (event) => {
    const movingSpeed = Number(event.target.value);
    handleHeroChange(selectedHeroIndex, { movingSpeed });
  };
  return (
    <div>
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ border: '1px solid black' }}
      onClick={(e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < CANVAS_WIDTH / 2 && y < CANVAS_HEIGHT) {
          handleHeroClick(0); // Hero 1
        } else if (x > CANVAS_WIDTH / 2 && y < CANVAS_HEIGHT) {
          handleHeroClick(1); // Hero 2
        }
      }}
    />
    <button onClick={() => shootBullet(0)}>Shoot Red Hero</button>
    <button onClick={() => shootBullet(1)}>Shoot Blue Hero</button>
    <div>
      <h2>Score</h2>
      {heroes.map((hero, index) => (
        <div key={index}>
          Hero {index + 1}: {hero.score}
        </div>
      ))}
    </div>

    {selectedHeroIndex !== null && (
      <div>
        <h3>Edit Hero {selectedHeroIndex + 1}</h3>
        <button onClick={() => handleColorChange('blue')}>Blue</button>
        <button onClick={() => handleColorChange('green')}>Green</button>
        <button onClick={() => handleColorChange('red')}>Red</button>
        <button onClick={() => handleColorChange('yellow')}>Yellow</button>
        
        <div>
          <label>Shoot Rate: </label>
          <input 
            type="range" 
            min="500" 
            max="3000" 
            step="100" 
            value={heroes[selectedHeroIndex].shootRate} 
            onChange={handleShootRateChange} 
          />
          <span>{heroes[selectedHeroIndex].shootRate} ms</span>
        </div>

        <div>
          <label>Movement Speed: </label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="1" 
            value={heroes[selectedHeroIndex].movingSpeed} 
            onChange={handleSpeedChange} 
          />
          <span>{heroes[selectedHeroIndex].movingSpeed} px/frame</span>
        </div>

        <button onClick={() => setSelectedHeroIndex(null)}>Cancel</button>
      </div>
    )}
  </div>
  );
}

export default App;