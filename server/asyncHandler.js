// Kääri async-reittikäsittelijä niin että hylätty Promise päätyy Expressin
// virheenkäsittelyyn (next(err)) sen sijaan että kaataisi koko prosessin
// käsittelemättömänä Promise-hylkäyksenä.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
