import random

_base62_characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def generate_random_base62(length=12):
    """
    Generate a random base62 encoded string of a specified length.

    :param length: The desired length of the base62 encoded string.
    :return: A base62 encoded string.
    """
    global _base62_characters
    return "".join(random.choice(_base62_characters) for _ in range(length))
