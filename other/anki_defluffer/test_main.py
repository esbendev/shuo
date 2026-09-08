import os
import unittest

import main


class MainCliContractTests(unittest.TestCase):
    def test_build_output_path_uses_deck_dir_and_result_name(self):
        result = main.build_output_path('../../ankiDecks/CAC', 'Lesson4')
        self.assertEqual(
            result,
            os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ankiDecks/CAC/Lesson4.txt')),
        )

    def test_build_output_path_adds_txt_extension_when_missing(self):
        result = main.build_output_path('../../ankiDecks/CAC', 'Lesson4')
        self.assertTrue(result.endswith('.txt'))


if __name__ == '__main__':
    unittest.main()
