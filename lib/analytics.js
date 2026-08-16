// In-memory analytics store
  // State persists within a single Node.js process (resets on server restart)

  if (!global.__analytics) {
    global.__analytics = {
      requests: {},
      recentActivity: [],
      totalRequests: 0,
      startTime: Date.now(),
    }
  }

  /**
   * Track a request to a given path.
   */
  export function trackRequest(path, method = 'GET', geo = {}) {
    const store = global.__analytics
    const key = `${method} ${path}`
    store.requests[key] = (store.requests[key] || 0) + 1
    store.totalRequests++
    store.recentActivity.unshift({
      path,
      method,
      country: geo.country || '',
      city:    geo.city    || '',
      ts:      Date.now(),
    })
    if (store.recentActivity.length > 200) store.recentActivity.pop()
  }

  /**
   * Get current analytics snapshot.
   */
  export function getStats() {
    const store = global.__analytics
    return {
      totalRequests:  store.totalRequests,
      requests:       store.requests,
      recentActivity: store.recentActivity.slice(0, 50),
      uptime:         Math.floor((Date.now() - store.startTime) / 1000),
    }
  }
  