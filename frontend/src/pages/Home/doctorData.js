import mhmdImg from "./assets/Images/Instructor/Mhmd Mubarak.webp";
import mhmdAvif from "./assets/Images/Instructor/Mhmd Mubarak.avif";
import abdullahImg from "./assets/Images/Instructor/Abdullah.webp";
import abdullahAvif from "./assets/Images/Instructor/Abdullah.avif";
import aliImg from "./assets/Images/Instructor/Ali.webp";
import aliAvif from "./assets/Images/Instructor/Ali.avif";
import fatimaImg from "./assets/Images/Instructor/Fatima.webp";
import fatimaAvif from "./assets/Images/Instructor/Fatima.avif";
import rayanImg from "./assets/Images/Instructor/Rayan.webp";
import rayanAvif from "./assets/Images/Instructor/Rayan.avif";
import abedImg from "./assets/Images/Instructor/Abed.webp";
import abedAvif from "./assets/Images/Instructor/Abed.avif";
import kawtharImg from "./assets/Images/Instructor/Kawthar.webp";
import kawtharAvif from "./assets/Images/Instructor/Kawthar.avif";
import sammouriImg from "./assets/Images/Instructor/Sammouri.webp";
import sammouriAvif from "./assets/Images/Instructor/Sammouri.avif";

/**
 * Instructor data for the 3D Glass Card Carousel (8 instructors).
 * 7 visible at a time, 1 hidden. Circular infinite loop.
 */

const instructors = [
    {
        id: 1,
        name: "Dr. Mubarak Mohammad",
        department: "Computer Science",
        image: mhmdImg,
        imageAvif: mhmdAvif,
        bio: "Educator and lifelong learner with industry experience in computer science, focused on student-centered teaching, critical thinking, and interdisciplinary innovation.",
        experience: "18 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 2,
        name: "Dr. Fatima Abdallah",
        department: "Computer Science",
        image: fatimaImg,
        imageAvif: fatimaAvif,
        bio: "Computer Science Lecturer with a PhD from Birmingham City University, researching agent-based modeling, energy systems, and IoT, with experience teaching core courses and supervising capstone projects.",
        experience: "12 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 3,
        name: "Dr. Rayane El Sibai",
        department: "Computer Science",
        image: rayanImg,
        imageAvif: rayanAvif,
        bio: "Assistant Professor at Al Maaref University with a PhD from Sorbonne University, researching Big Data and Machine Learning, and teaching core computer science and AI courses.",
        experience: "16 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 4,
        name: "Dr. Kawthar Zaraket",
        department: "Computer Science",
        image: kawtharImg,
        imageAvif: kawtharAvif,
        bio: "PhD candidate in Big Data for transportation, experienced in teaching, mentoring, and software development.",
        experience: "15 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 5,
        name: "Dr. Mohamad AlSamoury",
        department: "Computer Science",
        image: sammouriImg,
        imageAvif: sammouriAvif,
        bio: "PhD in Pure and Applied Mathematics specializing in PDEs, with university-level teaching and curriculum coordination experience at Al Maaref University, and publications in international journals.",
        experience: "17 Years",
        credentials: "PhD — Mathematics",
    },
    {
        id: 6,
        name: "Dr. Ali Ghorayeb",
        department: "Computer Science",
        image: aliImg,
        imageAvif: aliAvif,
        bio: "Ph.D. in Computer Science with academic leadership experience and current Lecturer at Al Maaref University, actively engaged in teaching, training, and community service.",
        experience: "20 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 7,
        name: "Dr. El Abed El Safadi",
        department: "Computer Science",
        image: abedImg,
        imageAvif: abedAvif,
        bio: "Experienced educator and researcher specializing in software architecture, data analysis, and risk assessment, with expertise in agile training, academic publishing, and public science communication.",
        experience: "22 Years",
        credentials: "PhD — Computer Science",
    },
    {
        id: 8,
        name: "Dr. Abdullah Abbas",
        department: "Computer Science",
        image: abdullahImg,
        imageAvif: abdullahAvif,
        bio: "Computer Engineer with a Master’s in Artificial Intelligence and a Ph.D. in Semantic Web. Specialized in ontologies, meta-modeling, and graph data, with industry experience at Orange Labs and involvement in ETSI standardization. Taught at universities in France and Lebanon.",
        experience: "14 Years",
        credentials: "PhD — Computer Science",
    },
];

export default instructors;
