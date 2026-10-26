"""시연용 음식 그림(SVG)을 만든다. 실제 가게 사진이 생기면 이 도구는 필요 없다.

    python3 tools/mock-photos/build.py              # 전부
    python3 tools/mock-photos/build.py sushi pho    # 일부만
    node tools/mock-photos/render.cjs tools/mock-photos/svg frontend/public/photos

render.cjs 는 Playwright(Chromium)로 SVG를 800x600 JPG로 찍는다. (npm i -D playwright 후 npx playwright install chromium)
"""
import importlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.makedirs(os.path.join(HERE, 'svg'), exist_ok=True)

only = set(sys.argv[1:])
for name in ('dishes_a', 'dishes_b', 'dishes_c'):
    module = importlib.import_module(name)
    for key, draw in module.DISHES.items():
        if only and key not in only:
            continue
        with open(os.path.join(HERE, 'svg', key + '.svg'), 'w', encoding='utf-8') as file:
            file.write(draw())
        print('svg', key)
