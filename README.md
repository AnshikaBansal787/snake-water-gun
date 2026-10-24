# 🎮 Snake, Water & Gun - Kids Arcade Adventure

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0%2B-black?style=for-the-badge&logo=flask&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Passing-success?style=for-the-badge&logo=github-actions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<p align="center">
  <b>A vibrant, full-stack arcade game for kids built with Python (Flask) and a bubbly, animated web frontend.</b>
</p>

</div>

---

## 🌟 Overview

This project transforms the classic **Snake, Water & Gun** console game into an exciting, kid-friendly full-stack web application. Players face off against **"Robot Buddy"** in a best-of-3 arena packed with cartoon animations, sound effects, bouncy 3D buttons, and victory confetti.

The core game logic, scoring, and round resolution are powered entirely by a **Flask REST API** preserving pythonic principles like `functools.reduce`.

---

## 🎯 Game Rules & Interactions

| Choice | Key | Beats | Loses To | Interaction |
| :--- | :---: | :--- | :--- | :--- |
| 🐍 **Silly Snake** | `0` | 💧 Splashy Water | 🔫 Super Blaster | Snake drinks water (+1) |
| 💧 **Splashy Water** | `1` | 🔫 Super Blaster | 🐍 Silly Snake | Water douses blaster (+1) |
| 🔫 **Super Blaster** | `2` | 🐍 Silly Snake | 💧 Splashy Water | Blaster shoots snake (+1) |

- **Identical choices**: Result in a **Friendly Tie (0 points)**.
- **Match Format**: **3 rounds per match**.
- **Winning the Match**: The sum of all 3 rounds (computed via `functools.reduce(lambda x, y: x + y, scores)`) determines whether you win 🏆, lose 🤖, or tie 🤝.

---

## ✨ Features

- 🕹️ **Two Play Modes (Dashboard)**:
  - 🤖 **1) Play with Computer**: Face off in solo mode against Robot Buddy.
  - 👥 **2) Play with Friend**: 2-player pass & play! Player 1 locks in a secret weapon 🔒, then Player 2 picks for an epic showdown clash!
- 🌈 **Kids-Friendly Visuals**: Bubbly typography (Google Fonts *Chewy* & *Fredoka*), floating clouds, twinkling stars, and bright pastel color schemes.
- 🎮 **Tactile 3D Buttons**: Chunky, bouncy arcade buttons designed for easy interaction on both desktop and touch devices.
- 🔊 **Built-in Web Audio Sound FX**: Zero-dependency browser-synthesized sounds (bubble pops, boings, fanfares) with a quick sound mute toggle.
- ⚡ **Clash Suspense Animation**: Random emoji cycling before revealing moves to build excitement.
- 🏆 **Rewarding Celebrations**: Multi-angle confetti blasts upon winning the trophy and an instant "Play Again" loop.
- ⌨️ **Keyboard Support**: Full keyboard playability (`0`, `1`, `2` to choose, `Y` or `Enter` to restart).
- 🧪 **Automated Test Coverage**: Comprehensive backend unit tests covering both solo and 2-player modes.

---

## 📁 Repository Structure

```
snake-water-gun/
│
├── app.py                 # Flask application server & REST API
├── requirements.txt       # Python project dependencies
├── test_app.py            # Automated test suite
├── .gitignore             # Git ignore configuration
├── README.md              # Project documentation
│
├── templates/
│   └── index.html         # Responsive kid-friendly arcade UI
│
└── static/
    ├── style.css          # Cartoon animations, 3D buttons & glow styles
    └── script.js          # Client-side game controller & Web Audio synthesizer
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- `pip` (Python package manager)

### 1. Clone the Repository
```bash
git clone https://github.com/AnshikaBansal787/snake-water-gun.git
cd snake-water-gun
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Flask Server
```bash
python app.py
```

### 4. Play the Game
Open your web browser and go to:
👉 **`http://127.0.0.1:5000`**

---

## 🔌 API Reference

### `POST /api/play-round`
Processes a round of Snake, Water, Gun for either **Single Player** or **2-Player (Friend)** mode.

#### 1. Play with Computer Request:
```json
{
  "mode": "computer",
  "choice": 0,
  "previous_scores": [1, -1]
}
```

#### 2. Play with Friend Request:
```json
{
  "mode": "friend",
  "p1_choice": 0,
  "p2_choice": 1,
  "previous_scores": [1, -1]
}
```

#### Response (Friend Mode Example):
```json
{
  "mode": "friend",
  "p1_choice": { "id": 0, "name": "Snake", "icon": "🐍" },
  "p2_choice": { "id": 1, "name": "Water", "icon": "💧" },
  "round_status": "p1_win",
  "score_delta": 1,
  "reason": "Player 1's Snake beats Player 2's Water!",
  "current_round": 3,
  "match_over": true,
  "total_score": 1,
  "match_result": "p1_win",
  "match_message": "🎉 Player 1 Wins the Trophy! 🏆"
}
```

---

## 🧪 Running Tests

To verify backend routing, logic, and score resolution:

```bash
python test_app.py
```

Expected output:
```
....
----------------------------------------------------------------------
Ran 4 tests in 0.036s

OK
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
