// New service to fetch weather and environmental news
import * as Location from 'expo-location';

export async function fetchOpenWeather(apiKey) {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    let coords = { latitude: -26.2041, longitude: 28.0473 };
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      coords = loc.coords;
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const json = await res.json();
    return {
      success: true,
      data: {
        temp: Math.round(json.main?.temp ?? 22),
        humidity: json.main?.humidity ?? 60,
        condition: json.weather?.[0]?.main?.toLowerCase() ?? 'clear',
        city: json.name,
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Free env news API via NewsData.io or GNews fallback
export async function fetchEnvNews(apiKey) {
  try {
    // Use gnews.io (free tier) with environment query
    const url = `https://gnews.io/api/v4/search?q=environment+OR+climate+OR+recycling&lang=en&country=za&max=5&apikey=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    const items = (json.articles || []).map(a => ({
      title: a.title,
      time: new Date(a.publishedAt).toLocaleDateString(),
      url: a.url,
      source: a.source?.name || 'News',
      type: 'update'
    }));
    return { success: true, data: items };
  } catch (e) {
    return { success: false, error: e.message, data: [] };
  }
}
