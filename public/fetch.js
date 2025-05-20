const fetch_ = window.fetch;
window.fetch = function () {
  const [req] = arguments;
  if (req.url.startsWith('https://api.mapbox.com/map-sessions') || req.url.startsWith('https://events.mapbox.com/events')) {
    const res = new Response(undefined, {
      status: 200,
      statusText: 'OK',
    });
    return Promise.resolve(res);
  }
  return fetch_.apply(this, arguments);
};
