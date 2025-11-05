// Enhanced service to fetch weather and environmental news
import * as Location from 'expo-location';

export async function fetchOpenWeather(apiKey) {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        let coords = { latitude: -26.2041, longitude: 28.0473 }; // Johannesburg fallback

        if (status === 'granted') {
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 5000
                });
                coords = location.coords;
            } catch (locationError) {
                console.log('Using fallback coordinates:', locationError.message);
            }
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const json = await response.json();

        if (response.ok) {
            return {
                success: true,
                data: {
                    temp: Math.round(json.main?.temp ?? 22),
                    humidity: json.main?.humidity ?? 60,
                    condition: json.weather?.[0]?.main?.toLowerCase() ?? 'clear',
                    city: json.name || 'Your Location',
                    aqi: Math.floor(Math.random() * 50) + 20, // Mock AQI since it requires separate API
                }
            };
        } else {
            throw new Error(json.message || 'Weather API error');
        }
    } catch (error) {
        console.error('Weather fetch error:', error);
        return {
            success: false,
            error: error.message,
            data: {
                temp: 22,
                humidity: 65,
                condition: 'clear',
                city: 'Johannesburg',
                aqi: 42
            }
        };
    }
}

// Free environmental news using NewsAPI (you can get a free key at newsapi.org)
export async function fetchEnvNews(apiKey = 'demo') {
    try {
        // Using NewsAPI.org with environmental keywords
        const keywords = 'environment OR climate OR recycling OR sustainability';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;

        const response = await fetch(url);
        const json = await response.json();

        if (response.ok && json.articles) {
            const articles = json.articles
                .filter(article => article.title && article.url)
                .slice(0, 5)
                .map(article => ({
                    title: article.title,
                    time: getTimeAgo(article.publishedAt),
                    url: article.url,
                    source: article.source?.name || 'News',
                    type: categorizeNews(article.title),
                }));

            return { success: true, data: articles };
        } else {
            throw new Error(json.message || 'News API error');
        }
    } catch (error) {
        console.error('News fetch error:', error);
        // Return fallback campus news
        return {
            success: false,
            error: error.message,
            data: [
                { title: 'Campus Sustainability Initiative Wins Award', time: '2h ago', type: 'campus', source: 'Campus News' },
                { title: 'New Recycling Bins Installed Across Campus', time: '5h ago', type: 'update', source: 'Campus News' },
                { title: 'Student Recycling Rate Hits 85% This Month', time: '1d ago', type: 'achievement', source: 'Campus News' },
            ]
        };
    }
}

// Helper functions
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
}

function categorizeNews(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('campus') || titleLower.includes('university') || titleLower.includes('student')) {
        return 'campus';
    }
    if (titleLower.includes('recycl') || titleLower.includes('sustainab')) {
        return 'update';
    }
    if (titleLower.includes('award') || titleLower.includes('achiev') || titleLower.includes('record')) {
        return 'achievement';
    }
    return 'environment';
}
