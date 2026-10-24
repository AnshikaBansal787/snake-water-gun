import os
from flask import Flask, render_template, request, jsonify
from functools import reduce
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

CHOICE_META = {
    0: {"name": "Snake", "icon": "🐍", "color": "emerald"},
    1: {"name": "Water", "icon": "💧", "color": "sky"},
    2: {"name": "Gun", "icon": "🔫", "color": "amber"}
}

WIN_REASONS = {
    (0, 1): "Snake drinks Water! You win this round.",
    (1, 2): "Water douses Gun! You win this round.",
    (2, 0): "Gun shoots Snake! You win this round."
}

LOSE_REASONS = {
    (1, 0): "Snake drinks Water! Computer wins this round.",
    (2, 1): "Water douses Gun! Computer wins this round.",
    (0, 2): "Gun shoots Snake! Computer wins this round."
}


@app.route("/")
@app.route("/app.py")
def index():
    return render_template("index.html")


@app.route("/api/play-round", methods=["POST"])
@app.route("/app.py/api/play-round", methods=["POST"])
def play_round():
    data = request.get_json() or {}
    mode = data.get("mode", "computer")  # "computer" or "friend"
    previous_scores = data.get("previous_scores", [])
    if not isinstance(previous_scores, list):
        previous_scores = []

    # ------------------ FRIEND (2-PLAYER) MODE ------------------
    if mode == "friend":
        try:
            p1_ch = int(data.get("p1_choice", -1))
            p2_ch = int(data.get("p2_choice", -1))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid choice format"}), 400

        if p1_ch not in (0, 1, 2) or p2_ch not in (0, 1, 2):
            return jsonify({"error": "Choices must be 0 (Snake), 1 (Water), or 2 (Gun)."}), 400

        if p1_ch == p2_ch:
            score = 0
            round_status = "tie"
            reason = f"Both picked {CHOICE_META[p1_ch]['name']}! It's a draw."
        elif (p1_ch == 0 and p2_ch == 1) or (p1_ch == 1 and p2_ch == 2) or (p1_ch == 2 and p2_ch == 0):
            score = 1
            round_status = "p1_win"
            reason = f"Player 1's {CHOICE_META[p1_ch]['name']} beats Player 2's {CHOICE_META[p2_ch]['name']}!"
        else:
            score = -1
            round_status = "p2_win"
            reason = f"Player 2's {CHOICE_META[p2_ch]['name']} beats Player 1's {CHOICE_META[p1_ch]['name']}!"

        updated_scores = previous_scores + [score]
        current_round = len(updated_scores)
        match_over = current_round >= 3

        match_result = None
        match_message = None
        total_score = None

        if match_over:
            total_score = reduce(lambda x, y: x + y, updated_scores)
            if total_score > 0:
                match_result = "p1_win"
                match_message = "🎉 Player 1 Wins the Trophy! 🏆"
            elif total_score < 0:
                match_result = "p2_win"
                match_message = "🎉 Player 2 Wins the Trophy! 🏆"
            else:
                match_result = "tie"
                match_message = "🤝 Friendly Tie! Both are Champions!"

        return jsonify({
            "mode": "friend",
            "p1_choice": {
                "id": p1_ch,
                "name": CHOICE_META[p1_ch]["name"],
                "icon": CHOICE_META[p1_ch]["icon"]
            },
            "p2_choice": {
                "id": p2_ch,
                "name": CHOICE_META[p2_ch]["name"],
                "icon": CHOICE_META[p2_ch]["icon"]
            },
            "round_status": round_status,
            "score_delta": score,
            "reason": reason,
            "current_round": current_round,
            "match_over": match_over,
            "updated_scores": updated_scores,
            "total_score": total_score,
            "match_result": match_result,
            "match_message": match_message
        })

    # ------------------ COMPUTER (SOLO) MODE ------------------
    try:
        user_ch = int(data.get("choice", -1))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid choice format"}), 400

    if user_ch not in (0, 1, 2):
        return jsonify({"error": "Invalid input. Choice must be 0 (Snake), 1 (Water), or 2 (Gun)."}), 400

    # Computer makes a random choice (0: Snake, 1: Water, 2: Gun)
    comp_ch = random.randint(0, 2)

    # Core game outcome logic from user's script
    if user_ch == comp_ch:
        score = 0
        round_status = "tie"
        reason = f"Both chose {CHOICE_META[user_ch]['name']}! It's a draw."
    elif (user_ch == 0 and comp_ch == 1) or (user_ch == 1 and comp_ch == 2) or (user_ch == 2 and comp_ch == 0):
        score = 1
        round_status = "win"
        reason = WIN_REASONS.get((user_ch, comp_ch), "You win this round!")
    else:
        score = -1
        round_status = "lose"
        reason = LOSE_REASONS.get((user_ch, comp_ch), "Computer wins this round.")

    updated_scores = previous_scores + [score]
    current_round = len(updated_scores)
    match_over = current_round >= 3

    match_result = None
    match_message = None
    total_score = None

    # Calculate match winner using reduce when 3 rounds are completed
    if match_over:
        total_score = reduce(lambda x, y: x + y, updated_scores)
        if total_score > 0:
            match_result = "win"
            match_message = "🎉 Congratulations! You won the game!"
        elif total_score < 0:
            match_result = "lose"
            match_message = "😢 Sorry! You lost the game."
        else:
            match_result = "tie"
            match_message = "🤝 The game is a tie!"

    return jsonify({
        "mode": "computer",
        "user_choice": {
            "id": user_ch,
            "name": CHOICE_META[user_ch]["name"],
            "icon": CHOICE_META[user_ch]["icon"]
        },
        "comp_choice": {
            "id": comp_ch,
            "name": CHOICE_META[comp_ch]["name"],
            "icon": CHOICE_META[comp_ch]["icon"]
        },
        "round_status": round_status,
        "score_delta": score,
        "reason": reason,
        "current_round": current_round,
        "match_over": match_over,
        "updated_scores": updated_scores,
        "total_score": total_score,
        "match_result": match_result,
        "match_message": match_message
    })


if __name__ == "__main__":
    print("Starting Snake, Water & Gun Game on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
