import unittest
from app import app

class SnakeWaterGunTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_index_page(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Snake', response.data)
        self.assertIn(b'Water', response.data)
        self.assertIn(b'Gun', response.data)

    def test_play_round_valid(self):
        response = self.app.post('/api/play-round', json={
            "choice": 0,
            "previous_scores": []
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('user_choice', data)
        self.assertIn('comp_choice', data)
        self.assertIn('round_status', data)
        self.assertEqual(data['user_choice']['name'], 'Snake')
        self.assertEqual(data['current_round'], 1)
        self.assertFalse(data['match_over'])

    def test_play_round_completion(self):
        response = self.app.post('/api/play-round', json={
            "choice": 1,
            "previous_scores": [1, 1]
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['match_over'])
        self.assertIsNotNone(data['match_result'])
        self.assertIsNotNone(data['total_score'])

    def test_play_round_invalid_input(self):
        response = self.app.post('/api/play-round', json={"choice": 99})
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
