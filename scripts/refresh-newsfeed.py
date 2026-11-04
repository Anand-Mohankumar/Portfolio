"""Cache public Inoreader clips for the same-origin portfolio reader (no credentials)."""
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
MAX_PAGES = 10


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def find(self, class_name):
        for child in self.children:
            if isinstance(child, Node):
                if class_name in child.attrs.get('class', '').split():
                    yield child
                yield from child.find(class_name)

    def text(self):
        return ' '.join(''.join(c.text() if isinstance(c, Node) else c
                                for c in self.children).split())


class ClipParser(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def first(node, cls):
    return next(node.find(cls), Node())


def safe_url(value):
    return value if urlparse(value or '').scheme in ('http', 'https') else ''


def parse_clip(html, url):
    parser = ClipParser()
    parser.feed(html)
    articles = []
    for title in parser.root.find('article_magazine_title_link'):
        # Locate the card that owns this title without relying on the body's class.
        card = next((n for n in parser.root.find('article_magazine_content_wraper')
                     if n.tag == 'div' and title in list(n.find('article_magazine_title_link'))), None)
        if card is None or not safe_url(title.attrs.get('href')):
            continue
        picture = first(card, 'article_magazine_picture').attrs.get('style', '')
        image = re.search(r"url\(['\"]?(.*?)['\"]?\)", picture)
        articles.append({
            'id': title.attrs.get('id', title.attrs['href']),
            'title': title.text(), 'url': title.attrs['href'],
            'summary': first(card, 'article_magazine_content').text(),
            'source': first(card, 'article_author').text(),
            'image': safe_url(image.group(1)) if image else '',
        })
    continuation = first(parser.root, 'continuation_div')
    link = next((c for c in continuation.children if isinstance(c, Node) and c.tag == 'a'), Node())
    next_url = urljoin(url, link.attrs.get('href', '')) if link.attrs.get('href') else None
    # Only follow pagination on the exact public clip path.
    if next_url and (urlparse(next_url).netloc, urlparse(next_url).path) != (urlparse(url).netloc, urlparse(url).path):
        raise ValueError('Unexpected continuation URL')
    return articles, next_url


def refresh(key, tag):
    url = f'https://www.inoreader.com/stream/user/1005486907/tag/{quote(tag)}/view/html?cs=m'
    articles, seen, visited = [], set(), set()
    for _ in range(MAX_PAGES):
        if not url or url in visited:
            break
        visited.add(url)
        with urlopen(Request(url, headers={'User-Agent': 'CyberAmo-Newsfeed/1.0'}), timeout=30) as response:
            batch, url = parse_clip(response.read().decode('utf-8'), url)
        if not batch:
            raise ValueError(f'{key}: clip returned no articles; keeping previous cache')
        for item in batch:
            if item['id'] not in seen:
                seen.add(item['id'])
                articles.append(item)
    if not articles:
        raise ValueError(f'{key}: empty feed')
    data = {'updatedAt': datetime.now(timezone.utc).isoformat(), 'articles': articles}
    target = ROOT / 'newsfeed' / f'{key}.json'
    target.parent.mkdir(exist_ok=True)
    target.with_suffix('.tmp').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    target.with_suffix('.tmp').replace(target)
    print(f'{key}: cached {len(articles)} articles')


if __name__ == '__main__':
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda pair: refresh(*pair), [('ai', 'AI'), ('infosec', 'Infosec News')]))
