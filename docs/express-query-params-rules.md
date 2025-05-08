# Express.js Query Parameters Handling Rules

## Array Parameters Rule

When handling array parameters in Express.js, remember these key points:

1. **Frontend to Backend**:
   - Frontend sends parameters as: `brand`, `port`, `duration`
   - Access them in Express as: `req.query.brand`, `req.query.port`, `req.query.duration`

2. **Backend to External API**:
   - Convert parameters to API format: `brand[]`, `port[]`, `duration[]`
   - Example:
   ```javascript
   const params = {
     'brand[]': Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand],
     'port[]': Array.isArray(req.query.port) ? req.query.port : [req.query.port],
     'duration[]': Array.isArray(req.query.duration) ? req.query.duration : [req.query.duration]
   };
   ```

3. **Common Pitfalls**:
   - ❌ Don't look for `req.query['brand[]']` - this won't match frontend parameters
   - ✅ Do use `req.query.brand` to access the parameter
   - ✅ Always check if the parameter exists before using it
   - ✅ Convert single values to arrays when needed

4. **Best Practices**:
   - Log received parameters for debugging
   - Handle both array and single value cases
   - Set default values only when parameters are missing
   - Use proper type checking with `Array.isArray()`

## Example Implementation

```javascript
// Correct way to handle array parameters
app.get('/api/endpoint', (req, res) => {
  const params = {
    sort: 'departured_at',
    order: 'asc',
    page: req.query.page || 1
  };

  // Handle brand parameter
  if (req.query.brand) {
    params['brand[]'] = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
  } else {
    params['brand[]'] = ['25']; // Default brand
  }

  // Handle port parameter
  if (req.query.port) {
    params['port[]'] = Array.isArray(req.query.port) ? req.query.port : [req.query.port];
  } else {
    params['port[]'] = ['310']; // Default port
  }

  // Handle duration parameter
  if (req.query.duration) {
    params['duration[]'] = Array.isArray(req.query.duration) ? req.query.duration : [req.query.duration];
  }

  // Use params in API call
  axios.get('external-api-url', { params });
});
```

## Debugging Tips

1. Always log the received parameters:
```javascript
console.log('Received query parameters:', {
  raw: req.query,
  brand: req.query.brand,
  port: req.query.port,
  duration: req.query.duration
});
```

2. Log the parameters being sent to external API:
```javascript
console.log('Sending parameters to API:', params);
```

3. Check network tab in browser dev tools to verify:
   - Parameters sent from frontend
   - Parameters received by backend
   - Parameters sent to external API 