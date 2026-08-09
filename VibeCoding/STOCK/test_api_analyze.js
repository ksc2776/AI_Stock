const analyze = require('./api/analyze.js');

// Mock request and response objects
const req = {
  query: { code: '005930' }, // 삼성전자
  method: 'GET'
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('--- API Response ---');
    console.log('Status:', this.statusCode);
    console.log('Data:', JSON.stringify(data, null, 2));
    return this;
  },
  setHeader: function(name, value) {
    // console.log(`Header: ${name} = ${value}`);
  },
  end: function() {
    return this;
  }
};

console.log('Testing /api/analyze with code: 005930 (Samsung Electronics)...');
analyze(req, res).catch(err => {
  console.error('Test Failed:', err);
});
