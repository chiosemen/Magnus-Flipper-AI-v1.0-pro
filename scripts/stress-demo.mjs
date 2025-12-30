import autocannon from 'autocannon';

const target = process.env.TARGET || 'https://magnus-api.vercel.app/api/demo';
const marketplace = process.env.MARKETPLACE || 'gumtree';
const country = process.env.COUNTRY || 'GB';

// Rotate queries to simulate user behavior
const queries = [
  'iphone 14 london',
  'macbook pro m1 london',
  'ipad air',
  'samsung s23',
  'ps5',
  'airpods pro',
  'nintendo switch',
  'dell xps',
  'sony a7iii',
  'thinkpad x1',
];

function urlFor(q) {
  const u = new URL(target);
  u.searchParams.set('q', q);
  u.searchParams.set('marketplace', marketplace);
  u.searchParams.set('country', country);
  u.searchParams.set('maxItems', '40');
  return u.toString();
}

const connections = Number(process.env.CONCURRENCY || 20);
const duration = Number(process.env.DURATION || 30);

console.log('Target:', target);
console.log('Marketplace:', marketplace, 'Country:', country);
console.log('Concurrency:', connections, 'Duration:', duration, 's');

const instance = autocannon({
  url: urlFor(queries[0]),
  connections,
  duration,
  // cycle URLs by changing path per request
  requests: queries.map((q) => ({
    method: 'GET',
    path: new URL(urlFor(q)).pathname + '?' + new URL(urlFor(q)).searchParams.toString(),
  })),
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  console.log('\nDONE\n');
  console.log({
    latency_p50: result.latency.p50,
    latency_p90: result.latency.p90,
    latency_p99: result.latency.p99,
    rps_avg: result.requests.average,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
  });
});

