import staticDocument from '../index.html?raw';

function getStaticBody(source: string) {
  const match = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = match?.[1] ?? source;

  return body
    .replaceAll('src="public/', 'src="/')
    .replaceAll('href="public/', 'href="/')
    .replace(/<script[^>]*src="\/?app\.js"[^>]*><\/script>/i, '');
}

const staticBody = getStaticBody(staticDocument);

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: staticBody }} />
      <script src="/app.js" defer />
    </>
  );
}
