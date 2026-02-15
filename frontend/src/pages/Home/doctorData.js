import mhmdImg from "./assets/Images/Instructor/Mhmd Mubarak.png";
import abdullahImg from "./assets/Images/Instructor/Abdullah.png";
import aliImg from "./assets/Images/Instructor/Ali.png";
import fatimaImg from "./assets/Images/Instructor/Fatima.png";
import rayanImg from "./assets/Images/Instructor/Rayan.png";
import abedImg from "./assets/Images/Instructor/Abed.png";
import kawtharImg from "./assets/Images/Instructor/Kawthar.png";
import sammouriImg from "./assets/Images/Instructor/Sammouri.png";

/**
 * Instructor data for the 3D Glass Card Carousel (8 instructors).
 * 7 visible at a time, 1 hidden. Circular infinite loop.
 */

const instructors = [
    {
        id: 1,
        name: "Prof. Ahmad Khalil",
        department: "Computer Science",
        image: mhmdImg,
        bio: "Leading researcher in artificial intelligence and machine learning with extensive publications in top-tier journals.",
        experience: "18 Years",
        credentials: "PhD — Artificial Intelligence",
    },
    {
        id: 2,
        name: "Prof. Layla Hassan",
        department: "Mathematics",
        image: abdullahImg,
        bio: "Expert in applied mathematics and computational methods with a focus on numerical analysis and optimization theory.",
        experience: "14 Years",
        credentials: "PhD — Applied Mathematics",
    },
    {
        id: 3,
        name: "Prof. Omar Farouk",
        department: "Mechanical Engineering",
        image: aliImg,
        bio: "Renowned engineer specializing in thermodynamics, robotics, and advanced manufacturing systems design.",
        experience: "20 Years",
        credentials: "PhD — Mechanical Engineering",
    },
    {
        id: 4,
        name: "Prof. Sara Mansour",
        department: "Business Administration",
        image: fatimaImg,
        bio: "Specialist in strategic management, entrepreneurship, and organizational behavior with global consulting experience.",
        experience: "12 Years",
        credentials: "PhD — Business Strategy",
    },
    {
        id: 5,
        name: "Prof. Karim Nasser",
        department: "Physics",
        image: rayanImg,
        bio: "Dedicated physicist exploring quantum mechanics and particle physics with groundbreaking experimental research.",
        experience: "16 Years",
        credentials: "PhD — Theoretical Physics",
    },
    {
        id: 6,
        name: "Prof. Nadia El-Amin",
        department: "Health Sciences",
        image: abedImg,
        bio: "Experienced health sciences professor with expertise in public health policy, epidemiology, and biostatistics.",
        experience: "22 Years",
        credentials: "PhD — Public Health",
    },
    {
        id: 7,
        name: "Prof. Rami Touma",
        department: "Electrical Engineering",
        image: kawtharImg,
        bio: "Specialist in embedded systems, signal processing, and renewable energy engineering with industry partnerships worldwide.",
        experience: "15 Years",
        credentials: "PhD — Electrical Engineering",
    },
    {
        id: 8,
        name: "Prof. Hadi Sammouri",
        department: "Civil Engineering",
        image: sammouriImg,
        bio: "Expert in structural analysis, sustainable construction, and infrastructure resilience with award-winning research projects.",
        experience: "17 Years",
        credentials: "PhD — Structural Engineering",
    },
];

export default instructors;
