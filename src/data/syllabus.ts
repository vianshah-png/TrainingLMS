
import {
    BookOpen,
    CheckCircle2,
    Briefcase,
    Layers,
    Leaf,
    ListChecks,
    Target,
    Activity,
    Share2,
    FileSpreadsheet
} from "lucide-react";

export interface Topic {
    code: string;
    title: string;
    content: string;
    outcome?: string;
    activity?: string;
    assessment?: string;
    owner?: string;
    icon?: string;
    hasLive?: boolean;
    isAssignment?: boolean;
    assignmentQuestions?: string[];
    caseStudyLinks?: string[];
    caseStudies?: { label: string; url: string; thumbnail?: string }[];
    persona?: { story: string; goal: string };
    links?: { label: string; url: string; subtitle?: string; icon?: string; isPopup?: boolean; subLinks?: { label: string; url: string }[] }[];
    layout?: 'default' | 'grid';
    isBooking?: boolean;
    bookingUrl?: string;
    isDynamic?: boolean;
    isAccordion?: boolean;
    sort_order?: number;
}

export interface Module {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    topics: Topic[];
    type: 'module' | 'resource' | 'checklist' | 'pre-joining' | 'segment';
    progress: number;
    status: 'Available' | 'In Progress' | 'Locked' | 'Pending';
    hasAssignment: boolean;
    icon?: string;
}

export const syllabusData: Module[] = [
    // ===== MODULE 1: Pre-joining / Orientation =====
    {
        id: 'module-1',
        title: 'Module 1: Pre-joining Orientation',
        subtitle: 'Brand Immersion & Research',
        description: 'Deep dive into Balance Nutrition ecosystem, website, vision, and social media presence before joining.',
        type: 'pre-joining',
        progress: 0,
        status: 'Available',
        hasAssignment: true,
        icon: 'cleanse',
        topics: [
            {
                code: 'M1-01',
                title: 'Ecosystem Deep Dive',
                content: 'Study the core platform to understand the client interface.',
                layout: 'grid',
                links: [
                    { label: 'BN Website', url: 'https://www.balancenutrition.in/', subtitle: 'Explore our main platform where clients book programs and track their health journey.' },
                    { label: 'BN Cleanse', url: 'https://bncleanse.com/', subtitle: 'Our specialized detox and cleanse program platform for rapid health resets.' },
                    { label: 'BN Recipes', icon: 'target', url: 'https://www.balancenutrition.in/recipes', subtitle: 'A database of nutritionist-approved recipes provided to all clients.' },
                    { label: 'BN Health Score', icon: 'activity', url: 'https://www.balancenutrition.in/health-score', subtitle: 'The core diagnostic tool used to quantify and monitor client health status.' },
                    { label: 'BN Health Reads', icon: 'globe', url: 'https://www.balancenutrition.in/health-reads', subtitle: 'Educational blog and research articles for client knowledge and engagement.' },
                    { label: 'BN Program Catalogue', url: '/documents/BN_PROGRAM_CATALOGUE.pdf', icon: 'file-text', subtitle: 'Our complete program catalogue and pricing strategy.' },
                    { label: 'BN Product Catalogue', url: '/documents/BN_SHOP_PRODUCT_CATALOGUE.pdf', icon: 'file-text', subtitle: 'Overview of all proprietary BN physical products and supplements.' }
                ]
            },
            {
                code: 'M1-02',
                title: 'Meet Our Founders',
                content: 'Review the brochures and understand the core vision of Balance Nutrition. Understand what we stand for and our promise to clients.',
                links: [
                    { label: 'About Us', url: 'https://www.balancenutrition.in/aboutus' },
                    { label: 'Khyati Journey', url: 'https://yourstory.com/2017/12/youngest-chief-nutritionist-india-helping-10000-people-battle-weight-issues-email-meet-khyati-rupani' },
                    { label: 'Youtube series', url: 'https://www.youtube.com/@BalanceNutrition/playlists' }
                ]
            },
            {
                code: 'M1-03',
                title: 'Social Media Assessment',
                content: 'Study all official channels. Click an ID to copy it for quick search on your phone.<br/><br/> ',
                layout: 'grid',
                links: [
                    { label: 'Instagram @balancenutrition.in', url: 'balancenutrition.in', icon: 'instagram', isCopyOnly: true },
                    { label: 'Instagram @nutritionwithkhyati', url: 'nutritionwithkhyati', icon: 'instagram', isCopyOnly: true },
                    { label: 'LinkedIn BN', url: 'https://www.linkedin.com/company/balance-nutrition-weight-loss-&-more/' },
                    { label: 'LinkedIn Khyati', url: 'https://www.linkedin.com/in/nutritionistkhyatirupani' },
                    { label: 'YouTube', url: 'https://youtube.com/c/BalanceNutrition' },
                    { label: 'Facebook', url: 'https://www.facebook.com/khyati.rupani.3?mibextid=wwXIfr' }
                ]
            }
        ]
    },

    // ===== MODULE 2: Business Overview =====
    {
        id: 'module-2',
        title: 'Module 2: Business Overview',
        subtitle: 'Operational Workflows & Product Training',
        description: 'Mastering the internal tools, programs, e-kit, mobile application, and counselor dashboard.',
        type: 'module',
        progress: 0,
        status: 'Available',
        hasAssignment: true,
        icon: 'business',
        topics: [
            {
                code: 'M2-01',
                title: 'How We Work',
                content: 'Video explaining the complete client journey from purchase to completion.',
                links: [
                    { label: 'How We Work Video', url: 'https://youtu.be/WpaY3G9RGyY' },
                    { label: 'Glossary', url: 'https://docs.google.com/spreadsheets/d/1gemc5b7d-UsGNfIoQTGuh2FkslabYmPmp_ybznjxGSA/edit?gid=1915602987#gid=1915602987' },
                    { label: 'BN Statistics', url: 'https://docs.google.com/spreadsheets/d/195nuyHuXtRsprI97R6x1sp_kKWxfCh_jXEdpyz846a8/edit?usp=sharing', subtitle: 'These are company numbers used to build authority and trust during consultation calls.' }
                ]
            },
            {
                code: 'M2-02',
                title: 'Awards and Recognition',
                content: 'Explore the international accolades, media features, and brand milestones of Balance Nutrition.',
                links: [
                    { label: "Vishal Sir's BTVI Interview", url: 'https://www.youtube.com/watch?v=slBpy4wPX5g&t=8s' },
                    { label: 'Media-Awards-Recognition', url: 'https://www.youtube.com/watch?v=VPrT-yRt9v8#action=share' }
                ]
            },
            {
                code: 'M2-03',
                title: 'Program Training',
                content: 'Select a program from the dropdown below to explore its structure and protocols.',
                isAccordion: true,
                links: [
                    {
                        label: 'Program Training Recording',
                        url: 'https://us06web.zoom.us/rec/play/LEleYRJJTdk9jVOq1fdRn_-bSxcuczslgg-O4I2BlSLSIJaod7wq2lOYjygnCtzVxS__bNi_HZFMhF-G.ciquqYqkwaewWofq?eagerLoadZvaPages=sidemenu.billing.plan_management&accessLevel=meeting&canPlayFromShare=true&from=share_recording_detail&continueMode=true&componentName=rec-play&originRequestUrl=https%3A%2F%2Fus06web.zoom.us%2Frec%2Fshare%2F2eBla490EonzMCtdEFEACKWff_wcSIm7L-Xea2Tjs6YKJtCyCO61C1D7HkOhCEMi.91w22q29HVh6aMvb',
                        subLinks: [
                            { label: 'Weight Loss Pro Program', url: 'https://www.youtube.com/watch?v=3zx6UDOJW10' },
                            { label: 'Weight Loss Plus Program', url: 'https://www.youtube.com/watch?v=Pjh66SSPRpg' },
                            { label: 'Beat PCOS Program', url: 'https://youtu.be/LIrccmmw65k' },
                            { label: 'Slim Smart 30', url: 'https://youtu.be/4U56FpjvteM' },
                            { label: 'Renue Program', url: 'https://youtu.be/FXBqPTEqEVU' },
                            { label: 'Body Transformation Program', url: 'https://www.youtube.com/watch?v=vtLWQ9HI18U' },
                            { label: 'Plateau Breaker Program', url: 'https://www.youtube.com/watch?v=Ex1d94x7b-A' },
                            { label: 'Active Weight Loss Program', url: 'https://www.youtube.com/watch?v=orIp1QRR6u0' },
                            { label: 'Reform Intermittent Fasting', url: 'https://youtu.be/tk3o_PuqASw' },
                            { label: 'Slimpossible 60 Program', url: 'https://youtu.be/1098FRtg9ZQ' }
                        ]
                    }
                ]
            },
            {
                code: 'M2-04',
                title: 'Product Training (Kits)',
                content: 'Deep dive into the specific kits and lifestyle guides provided to clients.',
                links: [
                    { label: 'E-Kits Ecosystem', url: 'https://www.youtube.com/watch?v=lCbJs_FYueQ&t=444s' },
                    { label: 'App Feature - Alcohol Guide', url: 'https://res.cloudinary.com/dg4wzx8c8/video/upload/v1759304799/app_images/ubegnn0cfmzazh7u15ay.mp4' },
                    { label: 'App Feature - Restaurant Guide', url: 'https://res.cloudinary.com/dg4wzx8c8/video/upload/v1759303713/app_images/rt24vbelaswemhdbessr.mp4' },
                    { label: 'App Feature - Quick Filler', url: 'https://res.cloudinary.com/dg4wzx8c8/video/upload/v1759304944/app_images/tetgjgq3lilyo5enwmaz.mp4' },
                    { label: 'BN Guide - Eating Portions', url: 'https://balancenutrition.in/media/ekits/eat_in_portions.pdf' }
                ]
            },
            {
                code: 'M2-05',
                title: 'Peer Review',
        content: 'Conduct a commercial and comparative audit of Balance Nutrition versus market peers.<br/><br/><strong>Objective:</strong> To understand how Balance Nutrition stands against key market competitors in terms of approach, sales pitching, and digital presence.<br/><br/><strong>Instructions:</strong><br/>1. Create Your persona: Using the example below, define your own age, weight and goal for this audit.<br/>2. Select 2 Peer Companies & 2 Peer Dietitians to audit alongside <strong>Balance Nutrition</strong> and <strong>Khyati Rupani</strong>.<br/>3. Conduct the research and fill the audit columns.</br><br/> <strong>Note:</strong> You can complete the peer review by the end of training, but initiate the process of booking consultation call with BN competitors as soon as possible.</b><b>remember to keep your created persona as the person you are auditing for.</b><b>',
                isAssignment: true,
                persona: {
                    story: "Example: I am 35 years old, 5'6\" tall, and weigh 230 lbs. I have been overweight for a long time but don’t have any health problems.",
                    goal: "Lose weight and get rid of my obesity."
                },
                assignmentQuestions: [
                    "Lead Capture & Enquiries: Where and How was the initial enquiry process?",
                    "Speed of Activation: How long did it take for the first response?",
                    "First Impression call: Evaluate the tone, energy, and professionalism.",
                    "Health Discovery: Did the counselor deep-dive into your history?",
                    "Problem-to-Solution Transition: How effectively did they link goals to features?",
                    "Program Pitching Quality: Evaluate confidence and clarity.",
                    "Pricing Strategy: How was pricing introduced?",
                    "Objection Handling: How did they manage concerns?",
                    "Which company would you purchase from and why?",
                    "Digital Content Quality: Analyze scientific vs promotional balance.",
                    "Relatability & Trust: Who felt more authentic?"
                ],
                links: [
                    { label: 'Healthify Me', url: 'https://www.healthifyme.com/' },
                    { label: 'Sugar Fit', url: 'https://www.sugarfit.com/' },
                    { label: 'Fitelo', url: 'https://fitelo.co/' },
                    { label: 'Fittr', url: 'https://www.fittr.com/' },
                    { label: 'Fitterfly', url: 'https://www.fitterfly.com/' },
                    { label: 'Livofy', url: 'https://www.livofy.com/' },
                    { label: 'Anjali Mukherjee IG', url: 'https://www.instagram.com/anjalimukherjee/' },
                    { label: 'Rashi Chaudhary IG', url: 'https://www.instagram.com/rashichaudhary/' },
                    { label: 'Neha Ranglani IG', url: 'https://www.instagram.com/neharanglani_/?hl=en' },
                    { label: 'Pooja Makhija IG', url: 'https://www.instagram.com/poojamakhija/?hl=en' }
                ]
            }
        ]
    },

    // ===== MODULE 3: Consultation Training =====
    {
        id: 'module-3',
        title: 'Module 3: Consultation Training',
        subtitle: 'Client Engagement & Counselling Mastery',
        description: 'Learning to pitch programs, engage clients day-to-day, and analyze health journeys.',
        type: 'module',
        progress: 0,
        status: 'Available',
        hasAssignment: true,
        icon: 'health',
        topics: [
            {
                code: 'M3-01',
                title: 'Training by Counsellors',
                content: 'Observe live calls by senior counsellors and understand call etiquette.',
                isAccordion: true,
                links: [
                    {
                        label: 'Objection Handling by Khyati Maam',
                        url: 'https://drive.google.com/drive/folders/1IOYPqCpUsC6iwQOdQKx1TcfDJjhGvJCo?usp=sharing',
                        subLinks: [
                            { label: "Body composition on online plan", url: "https://drive.google.com/file/d/1rCb8l6tV_lyjaY5PSC_BGrjgvyCXJ1p0/view?usp=drive_link" },
                            { label: "Cancer Patient", url: "https://drive.google.com/file/d/1Ys5LFeHMoYhTIkTwd-1-6XgrhWpnNvTL/view?usp=drive_link" },
                            { label: "Daily essential", url: "https://drive.google.com/file/d/1exR0Wjzse1zlNQZ8tcyvztzlbZLtfok0/view?usp=drive_link" },
                            { label: "NRI Ingredient and food choices", url: "https://drive.google.com/file/d/1gIYaZxbwAA4fBIduqqwID8XhmidaGlrJ/view?usp=drive_link" },
                            { label: "Miscarriage", url: "https://drive.google.com/file/d/1UL6gm5ku1w3FOfwr5LZAgAWCtT7gt2k6/view?usp=drive_link" },
                            { label: "What kind of diet we give", url: "https://drive.google.com/file/d/1PcL8bsb7oWG9wo2btjXvb7rY3jAPPeRU/view?usp=drive_link" },
                            { label: "Post pregnancy weight loss", url: "https://drive.google.com/file/d/1N84VHBUetPph8cCnrS6FmSTuEtOVN3Ws/view?usp=drive_link" },
                            { label: "Why no call", url: "https://drive.google.com/file/d/1342O5QtmaK8vvSGWVWSECL1VboYa2qJE/view?usp=drive_link" },
                            { label: "Sample diet", url: "https://drive.google.com/file/d/1-yiUiwqfkrWfDy6UhScAM9ijKkdopWYi/view?usp=drive_link" },
                            { label: "How much weight loss", url: "https://drive.google.com/file/d/1IpbQszQ_rUFy7yPs4R3lqkR1G238J4Jl/view?usp=drive_link" },
                            { label: "Intermittent Fasting", url: "https://drive.google.com/file/d/13GEkIalbliVndPzFwoOvTrymqahUwqL3/view?usp=drive_link" },
                            { label: "Guarantee weight loss", url: "https://drive.google.com/file/d/1oKbMxnmnu1aX17dV_RVCOUACn1Kfnyno/view?usp=drive_link" },
                            { label: "Restaurant guide", url: "https://drive.google.com/file/d/1-uqfwNh7CqTnIzuw4da-eoX0hTUhp5tx/view?usp=drive_link" }
                        ]
                    },
                    {
                        label: 'Consultation Calls',
                        url: 'https://drive.google.com/drive/folders/1HuBQpNCYUjEzpSKqS7p1inMx_Xf1O-mK?usp=sharing',
                        subLinks: [
                            { label: "Basic of consultation", url: "https://drive.google.com/file/d/1Y3sOOowdJzAKxHeXXfISaoiXwy53uM9-/view?usp=drive_link" },
                            { label: "Khyati Ma'am welcome call", url: "https://drive.google.com/file/d/1bqRhCkpWPgN-_Q4QT0ecPRZZQNoV3qKD/view?usp=drive_link" },
                            { label: "Kajal Consultation call record", url: "https://drive.google.com/file/d/17Tcs4VzqTWdDoptkVrwipLbu1MXPtPAE/view?usp=drive_link" },
                            { label: "Nazneen consultation call record 2", url: "https://drive.google.com/file/d/1A7QM95lBgXKdrq7xhudtMQtFfG6Uz5hX/view?usp=sharing" },
                            { label: "Mithila Lead consultation call", url: "https://drive.google.com/file/d/1E96Drw4ObRWEjGAQFP72QdWyVsoqJNyU/view?usp=drive_link" },
                            { label: "Urmila consultation call record 2", url: "https://drive.google.com/file/d/1FVcZ2SWM9WCBmiQqwdKOP4eMEerIYzAg/view?usp=drive_link" },
                            { label: "Palak Consultation call recording", url: "https://drive.google.com/file/d/1_jgau6SiDSNfxqJWx8ohtL6P_K4dnwhF/view?usp=drive_link" },
                            { label: "Urmila consultation call record 1", url: "https://drive.google.com/file/d/1ezm4zSnBNZFVXBpV_EkGyQJ--03zxjys/view?usp=drive_link" },
                            { label: "Nazneen consultation call record 1", url: "https://drive.google.com/file/d/1jzQxgwzuszvuWaTpqLokks9riIdqm-6w/view?usp=drive_link" }
                        ]
                    }
                ]
            },
            {
                code: 'M3-02',
                title: 'Day-to-Day Lead Engagement',
                content: 'Strategies for daily client engagement, motivation, and milestone tracking.',
                links: [
                    { label: 'Engagement Guide by Kajal', url: 'https://drive.google.com/file/d/1mrrNxIUOXRKXPVYZsDYvf64fp-8gbOS2/view?usp=sharing' }
                ]
            },
            {
                code: 'M3-03',
                title: 'Case Studies',
                content: 'Analyze specific client cases and their health journeys.',
                caseStudies: [
                    { label: "Case Study 1", url: "https://docs.google.com/presentation/d/1evTjDAlsTwek7th4ROos1rHo5CpEwczE/edit?usp=drive_link" },
                    { label: "Case Study 2", url: "https://docs.google.com/presentation/d/1zZ1HWrhFWFxtgAzBAlIVmCiFJzp7ozoi/edit?usp=drive_link" },
                    { label: "Case Study 3", url: "https://docs.google.com/presentation/d/1vWqg29CmqDKvsf4iMUr3JSWWD8tiZ0QK/edit?usp=drive_link" },
                    { label: "Case Study 4", url: "https://docs.google.com/presentation/d/1x7CEHyQ_QpG0t_vIE3bMVdQ-tLvFV-BT/edit?usp=drive_link" },
                    { label: "Case Study 5", url: "https://docs.google.com/presentation/d/1wkSSD0O-zVh03L78tcPiumgo6_aOCEh_/" },
                    { label: "Case Study 6", url: "https://docs.google.com/presentation/d/1z7EE9GLwCYa-IPTXooEmM1I2nmWN8jaC/" },
                    { label: "Case Study 7", url: "https://docs.google.com/presentation/d/1H2jTl6f6HWZwg0EjCQemXBvDBy3a6571/" },
                    { label: "Case Study 8", url: "https://docs.google.com/presentation/d/1bYOuG1eAK4gI3i04HNQ_v8wVBSkMpLw-/" },
                    { label: "Case Study 9", url: "https://docs.google.com/presentation/d/12lQ7zOojOnjrIQvWoGV3deg5uEXD-R73/" },
                    { label: "Case Study 10", url: "https://docs.google.com/presentation/d/1yk643b3nqYTHWRyaqy9aE7gUkompH0c9/" },
                    { label: "Case Study 11", url: "https://docs.google.com/presentation/d/1LIe39pHyV0jrJqD6stVnJAkldQSfhF2V/" },
                    { label: "Case Study 12", url: "https://docs.google.com/presentation/d/1bTsF-dbhUi6w7AHP9zQuFrL-AIfQU1jx/" },
                    { label: "Case Study 13", url: "https://docs.google.com/presentation/d/1oOmD5NVRtYcfGRBdPVr6_ll2sMNxIIpD/" },
                    { label: "Case Study 14", url: "https://docs.google.com/presentation/d/1e8RI6bUG3lUmkHHhIj4wP-0FT6KJDcay/" }
                ]
            },
            {
                code: 'M3-04',
                title: 'Inbody BCA training video',
                content: 'Study the Inbody analysis protocols for accurate body composition assessment.',
                layout: 'grid',
                links: [
                    { label: 'BCA Training: Part 1', url: 'https://balancenutrition.in/media/bca/BCA1.mp4', subtitle: 'Understanding the basic parameters and Inbody setup.' },
                    { label: 'BCA Training: Part 2', url: 'https://balancenutrition.in/media/bca/BCA.mp4', subtitle: 'Advanced interpretation of visceral fat and muscle-fat analysis.' },
                    { label: 'BN Smart Scale', url: 'https://drive.google.com/file/d/1e71iJ_c7Af_3kyIxVj2JC9rV_ttPoxLp/view?usp=drive_link', subtitle: 'Step-by-step demonstration of the Balance Nutrition Smart Scale integration and body composition analysis.' }
                ]
            },
            {
                code: 'M3-05',
                title: 'Schedule Your Mock Call',
                content: 'Book a 1-on-1 mock consultation call with your training lead to verify your training progress.',
                isBooking: true
            }
        ]
    },

    // ===== MODULE 4: Dashboard Training =====
    {
        id: 'module-4',
        title: 'Module 4: Dashboard Training',
        subtitle: 'Mastering the Counselor Operating System',
        description: 'Guided walkthrough of the counselor dashboard, lead tracking, and the prescription writing engine.',
        type: 'module',
        progress: 0,
        status: 'Available',
        hasAssignment: true,
        icon: 'layers',
        topics: [
            {
                code: 'M4-01',
                title: 'Dashboard Operating System',
                content: 'Experience the primary dashboard interface. Learn to navigate between active clients, pending assessments, and lead queues.',
                links: [
                    { label: 'New Dashboard Training', url: 'https://drive.google.com/file/d/15uCOJerhQPSOm0-mT7v69nwwYI--hvFP/view?usp=sharing' },
                    { label: 'Dashboard Zoom Training', url: 'https://us06web.zoom.us/rec/play/YuxuYhPOyeSZVV6EAPk29-02-hpnKoxAeUhs-MSemS2gVkC1W7aHM5eyBtEk2DT0d6uQ0YJcosy5uI2N.cA7ZDPQ25UO-MvaE?eagerLoadZvaPages=&accessLevel=meeting&canPlayFromShare=true&from=share_recording_detail&continueMode=true&componentName=rec-play&originRequestUrl=https%3A%2F%2Fus06web.zoom.us%2Frec%2Fshare%2FYYZegf70CLl_i0uZkDsged9FbRJqU78GOB4iGNCfTjXgQwNuU5e9UTaov6w1BwSt.hjQaGMo8uoG722M5' },
                    { label: 'Explore Dashboard', url: 'https://counsellor.balancenutrition.in/' }
                ]
            },
            {
                code: 'M4-02',
                title: 'Business Proficiency Viva',
                content: 'Simulate a live client consultation. The AI client will ask about Balance Nutrition programs (U-Smart, Smart+, etc.). Practice explaining our USPs and pricing.',
                hasLive: true,
                persona: {
                    story: "I am a 32-year-old marketing manager with PCOS and weight gain. I've tried many diets but always fail.",
                    goal: "Ask the mentor about the difference between Weight Loss Pro and Beat PCOS programs. Focus on pricing and long-term support."
                }
            }
        ]
    },

    // ===== MODULE 5: Sales skill training =====
    {
        id: 'module-5',
        title: 'Module 5: Sales skill training',
        subtitle: 'Foundational Sales & Communication',
        description: 'Comprehensive sales training covering consultation structures, mock calls, and conversion strategies.',
        type: 'module',
        progress: 0,
        status: 'Available',
        hasAssignment: false,
        icon: 'business',
        topics: [
            {
                code: 'M5-01',
                title: 'Training Resource',
                content: 'Final management training summaries and wrap-up sessions.',
                links: [
                    { label: 'CIS live presentation and follow ups', url: 'https://docs.google.com/document/d/1OgHV7RzQNBrTXFWiIWhPyMKAQLSAIOy6/edit' },
                    { label: 'CIS Intro overview to sales2', url: 'https://docs.google.com/document/d/1rbAm8SwXj4SJ_0urlSmBQ4ss4md00SN3/edit' },
                    { label: 'CIS Goal setting', url: 'https://docs.google.com/document/d/1lo_Hx07qjO1YBxfYJCVhzLad8J4jqHgK/edit' },
                    { label: 'Engagement Manual', url: 'https://docs.google.com/document/d/1BGs732y6H04XHySp7r3ivu8n4fkF-MjMHJv_wYvbhA8/edit?tab=t.0#heading=h.lhggr0z4ly8' },
                    { label: 'Wallet Money Doc', url: 'https://docs.google.com/spreadsheets/d/1X9T8TJw9UX7AtdNiZrRUA_pvQYRM8AMd5Fu1kuozISo/edit?gid=0#gid=0' },
                    { label: 'WhatsApp Dos and Donts', url: 'https://drive.google.com/file/d/1fFUtJPGTBb_cLVGizvC4EwtKNOh23vDG/view' },
                    { label: 'Lead Conversion (Consultation) Training by Krishna', url: 'https://us06web.zoom.us/rec/play/tH49jQn_4nKfmAaHkjtYZD1BbE7XhVjxiMBK4qsp3PG_HHiPT24Q6Gbkmv9l1duLFczNqgJHrST8I0t-.hFkYNmkz4w3CAw5V?eagerLoadZvaPages=sidemenu.billing.plan_management&accessLevel=meeting&canPlayFromShare=true&from=share_recording_detail&continueMode=true&componentName=rec-play&originRequestUrl=https%3A%2F%2Fus06web.zoom.us%2Frec%2Fshare%2FFGUqZ4uRA8jnB-HXnKYReWXxUrCrpYB64UlBhHzjjVOfCpYilXKpJnSFoL8Q2yh1.rn_6BNdfPwOc10XD' }
                ]
            },
            {
                code: 'M5-02',
                title: 'Founders Sales Mastery Phase 2',
                content: 'Introduction to sales protocols, mock consultations, and foundational structures.',
                links: [
                    { label: 'Sales Training Part 1', url: 'https://www.youtube.com/watch?v=gYvr-Fdb9z4' },
                    { label: 'Sales Training Part 2', url: 'https://youtu.be/DlZCZRNHZfc' },
                    { label: 'Sales Training Part 3', url: 'https://youtu.be/lmRXwJgQOqk' }
                ]
            },
            {
                code: 'M5-03',
                title: 'Founders Sales Mastery Phase 3',
                content: 'Performance reviews, advanced mock calls, and founder-led consultation techniques.',
                links: [
                    { label: 'Sales Training Part 4', url: 'https://youtu.be/L9xqZVVkZs' },
                    { label: 'Sales Training Part 5', url: 'https://youtu.be/X2oH36s6w_E' },
                    { label: 'Sales Training Part 6', url: 'https://youtu.be/W2FKSOOA6' }
                ]
            },
            {
                code: 'M5-04',
                title: 'Founders Sales Mastery Phase 4',
                content: 'Handling objections, client feedback management, and old client call analysis.',
                links: [
                    { label: 'Sales Training Part 7', url: 'https://youtu.be/e_WOl6UuWMg' },
                    { label: 'Sales Training Part 8', url: 'https://www.youtube.com/watch?v=g6OzGs9McRA' }
                ]
            }
        ]
    },

    // ===== CONTENT BANK / RESOURCE VAULT =====
    {
        id: 'resource-bank',
        title: 'Content Bank',
        subtitle: 'Management Training & Asset Library',
        description: 'Access the full repository of sales training videos, training manuals, and founder protocols.',
        type: 'resource',
        progress: 0,
        status: 'Available',
        hasAssignment: false,
        icon: 'folder',
        topics: [
            {
                code: 'VB-01',
                title: 'Sales Training: Day 1 (Part 1)',
                content: 'Basic mock consultations and introduction to sales protocols.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/c_8Hkg5U3I0' }]
            },
            {
                code: 'VB-02',
                title: 'Sales Training: Day 1 (Part 2)',
                content: 'Detailed consultation structure walkthrough.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/gYvr-Fdb9z4' }]
            },
            {
                code: 'VB-03',
                title: 'Sales Training: Day 1 (Part 3)',
                content: 'Mock phone consultation training and follow-up strategies.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/DlZCZRNHZfc' }]
            },
            {
                code: 'VB-04',
                title: 'Sales Training: Day 2',
                content: 'Advanced mock phone consultation training sessions.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/ImRXwJgQOqk' }]
            },
            {
                code: 'VB-05',
                title: 'Sales Training: Day 3 (Part 1)',
                content: 'Analysis of old client calls and OC calls observation.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/e_WOl6UuWMg' }]
            },
            {
                code: 'VB-06',
                title: 'Sales Training: Day 3 (Part 2)',
                content: 'Handling bad feedback or poor results from old clients.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/W2FKSOOA6Q0' }]
            },
            {
                code: 'VB-07',
                title: 'Sales Training: Day 4 (Part 1)',
                content: 'General mock call sessions for performance review.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/eBoIuP-5SUA' }]
            },
            {
                code: 'VB-08',
                title: 'Sales Training: Day 4 (Part 2)',
                content: 'Identifying critical "Must to Refer" cases in mock calls.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/L9xqZVVkZs8' }]
            },
            {
                code: 'VB-09',
                title: 'Sales Training: Day 5 (Part 1)',
                content: 'Mock consultation session by the Founder.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/g6OzGs9McRA' }]
            },
            {
                code: 'VB-10',
                title: 'Sales Training: Day 5 (Part 2)',
                content: 'Advanced "Must to Refer" case study and mock analysis.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/X2oH36s6w_E' }]
            },
            {
                code: 'VB-11',
                title: 'Sales Training: Day 5 (Part 3)',
                content: 'Comprehensive review of Day 5 training modules.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/8oKBsxHZ94A' }]
            },
            {
                code: 'VB-12',
                title: 'Sales Training: Day 6 (Unlisted)',
                content: 'Final management team training summary and wrap-up.',
                links: [{ label: 'Watch Video', url: 'https://youtu.be/hM9O_PvTnf4' }]
            },
            {
                code: 'PV-P1-01',
                title: 'Weight Loss Pro Program',
                content: 'Phase 1: Advanced weight loss protocols and client management.',
                links: [{ label: 'Watch Training', url: 'https://www.youtube.com/watch?v=3zx6UDOJW10' }]
            },
            {
                code: 'PV-P1-02',
                title: 'Weight Loss Plus Program',
                content: 'Phase 1: Managing complex weight loss cases with comorbidities.',
                links: [{ label: 'Watch Training', url: 'https://www.youtube.com/watch?v=Pjh66SSPRpg' }]
            },
            {
                code: 'PV-P1-03',
                title: 'Beat PCOS Program',
                content: 'Phase 1: Hormonal balance and PCOS management protocols.',
                links: [{ label: 'Watch Training', url: 'https://youtu.be/LIrccmmw65k' }]
            },
            {
                code: 'PV-P1-04',
                title: 'Slim Smart30',
                content: 'Phase 1: 30-day intensive weight loss walkthrough.',
                links: [{ label: 'Watch Training', url: 'https://youtu.be/4U56FpjvteM' }]
            },
            {
                code: 'PV-P2-01',
                title: 'Renue Program',
                content: 'Phase 2: Skin health and anti-aging protocols.',
                links: [{ label: 'Watch Training', url: 'https://youtu.be/FXBqPTEqEVU' }]
            },
            {
                code: 'PV-P2-02',
                title: 'Body Transformation Program',
                content: 'Phase 2: Holistic transformation and lifestyle correction.',
                links: [{ label: 'Watch Training', url: 'https://www.youtube.com/watch?v=vtLWQ9HI18U' }]
            },
            {
                code: 'PV-P2-03',
                title: 'Plateau Breaker Program',
                content: 'Phase 2: Scientific strategies to overcome weight loss plateaus.',
                links: [{ label: 'Watch Training', url: 'https://www.youtube.com/watch?v=Ex1d94x7b-A' }]
            },
            {
                code: 'PV-P2-04',
                title: 'Active Weight Loss Program',
                content: 'Phase 2: Exercise-integrated weight loss management.',
                links: [{ label: 'Watch Training', url: 'https://www.youtube.com/watch?v=orIp1QRR6u0' }]
            },
            {
                code: 'PV-P2-05',
                title: 'Reform Intermittent Fasting',
                content: 'Phase 2: Mastering fasting protocols and client scheduling.',
                links: [{ label: 'Watch Training', url: 'https://youtu.be/tk3o_PuqASw' }]
            },
            {
                code: 'PV-P2-06',
                title: 'Slimpossible 60 Program',
                content: 'Phase 2: Comprehensive 60-day medical weight loss journey.',
                links: [{ label: 'Watch Training', url: 'https://youtu.be/1098FRtg9ZQ' }]
            }
        ]
    }
];
