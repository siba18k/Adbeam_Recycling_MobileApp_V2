import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';

export const seedRewards = async () => {
    const rewardsData = {
        'reward-1': {
            name: 'Campus Cafeteria Voucher',
            description: '₦50 off any meal at campus cafeteria',
            points: 500,
            category: 'food',
            image: 'https://via.placeholder.com/300x200?text=Cafeteria+Voucher',
            available: true,
            stock: 100
        },
        'reward-2': {
            name: 'Bookstore Discount',
            description: '₦100 discount at university bookstore',
            points: 1000,
            category: 'education',
            image: 'https://via.placeholder.com/300x200?text=Bookstore+Discount',
            available: true,
            stock: 50
        },
        'reward-3': {
            name: 'Gym Membership',
            description: '1 month free gym access',
            points: 2000,
            category: 'fitness',
            image: 'https://via.placeholder.com/300x200?text=Gym+Membership',
            available: true,
            stock: 20
        },
        'reward-4': {
            name: 'Adbeam T-Shirt',
            description: 'Limited edition eco-friendly t-shirt',
            points: 1500,
            category: 'merchandise',
            image: 'https://via.placeholder.com/300x200?text=Eco+T-Shirt',
            available: true,
            stock: 30
        },
        'reward-5': {
            name: 'Coffee Shop Voucher',
            description: '₦30 voucher for campus coffee shop',
            points: 300,
            category: 'food',
            image: 'https://via.placeholder.com/300x200?text=Coffee+Voucher',
            available: true,
            stock: 200
        }
    };

    try {
        const rewardsRef = ref(database, 'rewards');
        await set(rewardsRef, rewardsData);
        console.log('✅ Rewards seeded successfully!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error seeding rewards:', error);
        return { success: false, error: error.message };
    }
};

// You can also add other seeding functions here
export const seedTestUsers = async () => {
    // Add test users if needed
};

export const seedTestScans = async () => {
    // Add test scan data if needed
};
