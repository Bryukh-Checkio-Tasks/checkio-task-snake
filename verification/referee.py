from random import randint, choice
from checkio.signals import ON_CONNECT
from checkio import api
from checkio.referees.multicall import CheckiORefereeMulti

from tests import TESTS

ACTION = ("L", "R", "F")

# Legend
CHERRY = 'C'
TREE = 'T'
STRIKE_TREE = "S"
EATEN_SNAKE = "E"
SNAKE_HEAD = '0'
SNAKE = ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
EMPTY = "."

SIZE = 10
DISTANCE = 5
INITIAL_STEPS = 300


def find_snake(field_map):
    snake = {}
    for i, row in enumerate(field_map):
        for j, symbol in enumerate(row):
            if symbol in SNAKE or symbol == SNAKE_HEAD:
                snake[symbol] = (i, j)
    return snake


def find_new_head(snake, action):
    head = snake[SNAKE_HEAD]
    snake_dir = (head[0] - snake["1"][0], head[1] - snake["1"][1])
    if action == 'F':
        return head[0] + snake_dir[0], head[1] + snake_dir[1]
    elif action == 'L':
        return head[0] - snake_dir[1], head[1] + snake_dir[0]
    elif action == 'R':
        return head[0] + snake_dir[1], head[1] - snake_dir[0]
    else:
        raise ValueError("Action must be only L,R or F")


def pack_map(list_map):
    return [''.join(row) for row in list_map]


def create_cherry(field, head):
    distance = DISTANCE
    hrow, hcol = head
    possible = []
    while not possible:
        possible = [(i, j) for i in range(SIZE) for j in range(SIZE)
                    if field[i][j] == "." and (abs(i - head[0]) + abs(j - head[1])) == distance]
        distance = (distance + 1) % SIZE
    return choice(possible)


def initial_referee(field_map):
    head = find_snake(field_map)["0"]
    crow, ccol = create_cherry(field_map, head)
    temp_map = [[c for c in row] for row in field_map]
    temp_map[crow][ccol] = CHERRY
    return {
        "input": pack_map(temp_map),
        "step_count": INITIAL_STEPS
    }


def process_referee(referee_data, route):
    field_map = referee_data["input"]
    temp_map = [[c for c in row] for row in field_map]
    step_count = referee_data["step_count"]
    if not (isinstance(route, str)):
        referee_data.update({
            "result": False,
            "route": "",
            "result_text": "The input data is not string",
            "input": field_map})
        return referee_data
    if not route:
        referee_data.update({
            "result": False,
            "route": "",
            "result_text": "Empty input data",
            "input": field_map})
        return referee_data
    res_route = ""
    for ch in route:
        if step_count < 0:
            referee_data.update({
                "result": False,
                "route": res_route,
                "result_text": "Too many steps.",
                "input": pack_map(temp_map)})
            return referee_data
        if ch not in ACTION:
            referee_data.update({
                "result": False,
                "route": res_route,
                "result_text": "The route must contain only F,L,R symbols",
                "input": pack_map(temp_map)})
            return referee_data
        res_route += ch
        snake = find_snake(temp_map)
        tail = snake[max(snake.keys())]
        temp_map[tail[0]][tail[1]] = EMPTY
        new_head = find_new_head(snake, ch)
        for s_key in sorted(snake.keys())[:-1]:
            s = snake[s_key]
            temp_map[s[0]][s[1]] = str(int(temp_map[s[0]][s[1]]) + 1)
        if (new_head[0] < 0 or new_head[0] >= len(temp_map) or
                    new_head[1] < 0 or new_head[1] >= len(temp_map[0])):
            referee_data.update({
                "result": False,
                "route": res_route,
                "result_text": "The snake crawl outside",
                "input": pack_map(temp_map)})
            return referee_data
        elif temp_map[new_head[0]][new_head[1]] == 'T':
            temp_map[new_head[0]][new_head[1]] = STRIKE_TREE
            referee_data.update({
                "result": False,
                "route": res_route,
                "result_text": "The snake struck at the tree",
                "input": pack_map(temp_map)})
            return referee_data
        elif temp_map[new_head[0]][new_head[1]] in SNAKE:
            temp_map[new_head[0]][new_head[1]] = EATEN_SNAKE
            referee_data.update({
                "result": False,
                "route": res_route,
                "result_text": "The snake bit itself",
                "input": pack_map(temp_map)})
            return referee_data

        if temp_map[new_head[0]][new_head[1]] == 'C':
            temp_map[new_head[0]][new_head[1]] = SNAKE_HEAD
            if max(snake.keys()) == '9':
                referee_data.update({
                    "result": True,
                    "route": res_route,
                    "result_text": "You win!",
                    "input": pack_map(temp_map),
                    "is_goal": True,
                    "score": step_count})
                return referee_data
            else:
                temp_map[tail[0]][tail[1]] = str(int(max(snake.keys())) + 1)
                cherry = create_cherry(temp_map, new_head)
                temp_map[cherry[0]][cherry[1]] = CHERRY
                step_count -= 1
                referee_data.update({
                    "result": True,
                    "route": res_route,
                    "result_text": "Next move",
                    "input": pack_map(temp_map),
                    "step_count": step_count})
                return referee_data
        else:
            temp_map[new_head[0]][new_head[1]] = SNAKE_HEAD
        step_count -= 1
    referee_data.update({
        "result": True,
        "route": res_route,
        "result_text": "Next move",
        "input": pack_map(temp_map),
        "step_count": step_count})
    return referee_data


def is_win_referee(referee_data):
    return referee_data.get('is_goal', False)


api.add_listener(
    ON_CONNECT,
    CheckiORefereeMulti(
        tests=TESTS,
        initial_referee=initial_referee,
        process_referee=process_referee,
        is_win_referee=is_win_referee,
        function_name="snake"
    ).on_ready)