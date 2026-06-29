import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  Clock,
  BarChart4,
  KeyRound,
  Layout,
  CheckCircle2,
  ArrowRight,
  Users,
  Wallet,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X,
  IndianRupee,
  LineChart,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function PublicHome() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Business Owner",
      content:
        "SMART SAVE has completely transformed how I manage my daily savings. The transparency and ease of use are unmatched.",
    },
    {
      name: "Priya Patel",
      role: "Freelancer",
      content:
        "The daily tracking feature is fantastic. I can see my savings grow every day, and the customer support is excellent.",
    },
    {
      name: "Amit Kumar",
      role: "Shopkeeper",
      content:
        "Very reliable platform. The collection agents are punctual, and the app makes it easy to verify my daily deposits.",
    },
  ];

  const faqs = [
    {
      question: "What is SMART SAVE?",
      answer:
        "SMART SAVE is a digital savings platform designed to help members build long-term financial security through disciplined daily savings.",
    },
    {
      question: "How do I register?",
      answer:
        "You can register by clicking the 'Join Now' or 'Register' buttons, paying the one-time registration fee, and completing your profile.",
    },
    {
      question: "Is my money secure?",
      answer:
        "Yes, we use bank-grade security and transparent reporting to ensure your savings are completely secure and trackable at all times.",
    },
    {
      question: "When do I get the bonus?",
      answer:
        "The bonus is credited after completing the 180 days of daily payments and completing the mandatory 3-year waiting period.",
    },
  ];

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => scrollToSection("home")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#00509e] rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="text-white h-6 w-6" />
              </div>
              <div className="font-extrabold text-2xl tracking-tight text-[#003366]">
                SMART<span className="text-blue-600">SAVE</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection("home")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("plan")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                Plan
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                Benefits
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-slate-600 hover:text-[#003366] font-medium transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-[#003366] font-semibold hover:text-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-[#003366] to-[#00509e] text-white px-5 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-[#003366] focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <button
              onClick={() => scrollToSection("home")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("plan")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              Plan
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left px-3 py-3 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
            >
              Contact
            </button>
            <div className="grid grid-cols-2 gap-4 mt-4 px-3">
              <Link
                to="/login"
                className="text-center border border-[#003366] text-[#003366] py-2 rounded-lg font-semibold"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="text-center bg-[#003366] text-white py-2 rounded-lg font-semibold"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="home"
        className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-br from-[#003366]/5 via-blue-50 to-white relative"
      >
        {/* Soft glowing finance elements & abstract patterns */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-[#003366] rounded-full blur-[100px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[80px] opacity-10"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#003366 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#003366] font-medium text-sm mb-6 border border-blue-100 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Trusted by 5000+ Indian Families
                {/* Indian Flag SVG inside badge */}
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 900 600"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-1 rounded-[2px] shadow-sm"
                >
                  <rect width="900" height="200" fill="#f93" />
                  <rect y="200" width="900" height="200" fill="#fff" />
                  <rect y="400" width="900" height="200" fill="#128807" />
                  <g transform="translate(450,300)">
                    <circle r="90" fill="#000080" />
                    <circle r="80" fill="#fff" />
                    <circle r="15" fill="#000080" />
                    <g id="d">
                      <g id="c">
                        <g id="b">
                          <g id="a">
                            <path fill="#000080" d="M0,-90 L2,-15 L-2,-15 Z" />
                          </g>
                          <use href="#a" transform="rotate(15)" />
                        </g>
                        <use href="#b" transform="rotate(30)" />
                      </g>
                      <use href="#c" transform="rotate(60)" />
                    </g>
                    <use href="#d" transform="rotate(120)" />
                    <use href="#d" transform="rotate(240)" />
                  </g>
                </svg>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                SMART <span className="text-[#003366]">SAVE</span> <br />
                <span className="text-2xl lg:text-3xl font-bold text-slate-600 mt-2 block">
                  India's Trusted Digital Savings Platform
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                Save smarter with a secure digital platform designed for Indian
                families. Track savings, manage collections, and build long-term
                financial confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-[#003366] to-[#00509e] text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-[#002244] hover:to-[#003366] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
                >
                  Join Now{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-[#003366] border-2 border-[#003366] px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Member Login
                </Link>
                <Link
                  to="/login"
                  className="text-slate-600 px-6 py-4 rounded-xl font-semibold text-lg hover:text-[#003366] transition-colors flex items-center justify-center underline decoration-slate-300 underline-offset-4 hover:decoration-[#003366]"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none mt-12 lg:mt-0 relative z-10">
              {/* Subtle Semi-Transparent Indian Flag Background */}
              <div className="absolute -right-12 -top-12 lg:-right-24 lg:-top-16 opacity-[0.12] -z-10 blur-[1px] transform rotate-6 scale-110 pointer-events-none transition-transform duration-700 hover:rotate-3">
                <svg
                  width="450"
                  height="300"
                  viewBox="0 0 900 600"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-3xl shadow-2xl"
                >
                  <rect width="900" height="200" fill="#FF9933" />
                  <rect y="200" width="900" height="200" fill="#FFFFFF" />
                  <rect y="400" width="900" height="200" fill="#138808" />
                  <g transform="translate(450,300)">
                    <circle r="90" fill="#000080" />
                    <circle r="80" fill="#FFFFFF" />
                    <circle r="15" fill="#000080" />
                    <g id="d-bg">
                      <g id="c-bg">
                        <g id="b-bg">
                          <g id="a-bg">
                            <path fill="#000080" d="M0,-90 L2,-15 L-2,-15 Z" />
                          </g>
                          <use href="#a-bg" transform="rotate(15)" />
                        </g>
                        <use href="#b-bg" transform="rotate(30)" />
                      </g>
                      <use href="#c-bg" transform="rotate(60)" />
                    </g>
                    <use href="#d-bg" transform="rotate(120)" />
                    <use href="#d-bg" transform="rotate(240)" />
                  </g>
                </svg>
              </div>

              {/* Premium Background Shapes */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#003366]/20 to-blue-300/20 rounded-[40px] transform rotate-3 scale-105 blur-sm"></div>

              {/* Image Container */}
              <div className="relative bg-white rounded-[32px] p-2 shadow-2xl border border-white/50">
                <div className="overflow-hidden rounded-[24px] relative bg-gradient-to-b from-blue-50 to-white flex items-center justify-center min-h-[350px] lg:min-h-[450px]">
                  {/* Custom SVG Illustration */}
                  <svg
                    viewBox="0 0 800 600"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full absolute inset-0 object-cover"
                  >
                    {/* Background Skyline */}
                    <g opacity="0.3" fill="#cbd5e1">
                      <rect x="50" y="250" width="80" height="350" rx="4" />
                      <rect x="150" y="150" width="100" height="450" rx="4" />
                      <rect x="270" y="300" width="60" height="300" rx="4" />
                      <rect x="350" y="100" width="120" height="500" rx="4" />
                      <rect x="490" y="200" width="90" height="400" rx="4" />
                      <rect x="600" y="120" width="110" height="480" rx="4" />
                      <rect x="730" y="280" width="50" height="320" rx="4" />
                    </g>
                    
                    {/* Windows for skyline */}
                    <g opacity="0.1" fill="#003366">
                      <rect x="170" y="180" width="15" height="15" />
                      <rect x="200" y="180" width="15" height="15" />
                      <rect x="170" y="210" width="15" height="15" />
                      <rect x="200" y="210" width="15" height="15" />
                      <rect x="370" y="130" width="15" height="15" />
                      <rect x="400" y="130" width="15" height="15" />
                      <rect x="430" y="130" width="15" height="15" />
                      <rect x="620" y="150" width="15" height="15" />
                      <rect x="650" y="150" width="15" height="15" />
                    </g>

                    {/* Ground */}
                    <rect x="0" y="550" width="800" height="50" fill="#f1f5f9" />

                    {/* Rupee Symbol Background Pattern */}
                    <g opacity="0.05" fill="#003366" transform="translate(100, 100) scale(4)">
                      <text x="0" y="0" fontFamily="sans-serif" fontWeight="bold">₹</text>
                    </g>
                    <g opacity="0.05" fill="#003366" transform="translate(600, 400) scale(6)">
                      <text x="0" y="0" fontFamily="sans-serif" fontWeight="bold">₹</text>
                    </g>
                    <g opacity="0.05" fill="#003366" transform="translate(300, 500) scale(3)">
                      <text x="0" y="0" fontFamily="sans-serif" fontWeight="bold">₹</text>
                    </g>

                    {/* Father */}
                    <g transform="translate(180, 220)">
                      {/* Body */}
                      <rect x="20" y="90" width="100" height="240" rx="30" fill="#003366" />
                      {/* Neck */}
                      <rect x="60" y="70" width="20" height="30" fill="#d4a373" />
                      {/* Head */}
                      <circle cx="70" cy="50" r="35" fill="#d4a373" />
                      {/* Hair */}
                      <path d="M 35 50 Q 70 -10 105 50 Q 115 20 70 10 Q 25 20 35 50 Z" fill="#2d3748" />
                      {/* Arms */}
                      <path d="M 25 120 Q -20 180 30 250" fill="none" stroke="#003366" strokeWidth="25" strokeLinecap="round" />
                      <path d="M 115 120 Q 160 180 110 250" fill="none" stroke="#003366" strokeWidth="25" strokeLinecap="round" />
                    </g>

                    {/* Mother */}
                    <g transform="translate(320, 240)">
                      {/* Body (Sari) */}
                      <path d="M 30 90 L 90 90 L 110 330 L 10 330 Z" fill="#0ea5e9" />
                      <path d="M 20 90 Q 60 120 100 90 L 110 180 L 10 180 Z" fill="#0284c7" />
                      {/* Neck */}
                      <rect x="50" y="70" width="20" height="30" fill="#e6b88a" />
                      {/* Head */}
                      <circle cx="60" cy="50" r="32" fill="#e6b88a" />
                      {/* Hair */}
                      <path d="M 28 50 Q 60 -10 92 50 Q 95 80 100 100 Q 110 50 60 10 Q 10 50 20 100 Q 25 80 28 50 Z" fill="#1e293b" />
                      {/* Bindi */}
                      <circle cx="60" cy="40" r="3" fill="#ef4444" />
                      {/* Arms holding phone */}
                      <path d="M 25 110 Q 0 160 40 190" fill="none" stroke="#0ea5e9" strokeWidth="20" strokeLinecap="round" />
                      <path d="M 95 110 Q 120 160 80 190" fill="none" stroke="#0ea5e9" strokeWidth="20" strokeLinecap="round" />
                      {/* Phone */}
                      <rect x="45" y="165" width="30" height="50" rx="5" fill="#334155" transform="rotate(-15, 60, 190)" />
                      <rect x="48" y="168" width="24" height="44" rx="2" fill="#e2e8f0" transform="rotate(-15, 60, 190)" />
                      {/* Green success check on phone */}
                      <circle cx="60" cy="190" r="8" fill="#10b981" transform="rotate(-15, 60, 190)" />
                      <path d="M 56 190 L 59 193 L 64 187" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-15, 60, 190)" />
                    </g>

                    {/* Child */}
                    <g transform="translate(450, 330)">
                      {/* Body */}
                      <rect x="25" y="60" width="50" height="160" rx="15" fill="#f59e0b" />
                      {/* Neck */}
                      <rect x="45" y="50" width="10" height="15" fill="#e6b88a" />
                      {/* Head */}
                      <circle cx="50" cy="35" r="25" fill="#e6b88a" />
                      {/* Hair */}
                      <path d="M 25 35 Q 50 -5 75 35 Q 85 10 50 5 Q 15 10 25 35 Z" fill="#2d3748" />
                      {/* Arms */}
                      <path d="M 30 80 Q 10 120 30 160" fill="none" stroke="#f59e0b" strokeWidth="15" strokeLinecap="round" />
                      <path d="M 70 80 Q 90 120 70 160" fill="none" stroke="#f59e0b" strokeWidth="15" strokeLinecap="round" />
                    </g>

                    {/* Digital Growth Charts overlay */}
                    <g transform="translate(550, 150)">
                      <rect x="0" y="0" width="180" height="120" rx="10" fill="white" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                      <text x="20" y="30" fontFamily="sans-serif" fontSize="14" fill="#64748b" fontWeight="bold">Total Savings</text>
                      <text x="20" y="60" fontFamily="sans-serif" fontSize="24" fill="#003366" fontWeight="bold">₹ 24,500</text>
                      <path d="M 20 100 Q 50 90 80 100 T 140 70 L 160 50" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="160" cy="50" r="6" fill="#10b981" />
                    </g>

                    {/* Floating Shield */}
                    <g transform="translate(100, 180)">
                      <rect x="0" y="0" width="60" height="60" rx="16" fill="white" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                      <path d="M 30 15 L 45 22 V 32 C 45 40 38 48 30 50 C 22 48 15 40 15 32 V 22 L 30 15 Z" fill="#0ea5e9" />
                      <path d="M 23 33 L 28 38 L 38 25" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                  </svg>
                  
                  {/* Realistic Indian National Flag */}
                  <div className="absolute top-5 right-5 z-20 shadow-md border border-white/50 rounded-sm overflow-hidden flex flex-col w-12 h-8 hover:scale-110 transition-transform">
                    <div className="h-1/3 w-full bg-[#FF9933]"></div>
                    <div className="h-1/3 w-full bg-white flex items-center justify-center relative">
                      <svg width="10" height="10" viewBox="0 0 24 24" className="text-[#000080]">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                        <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                    </div>
                    <div className="h-1/3 w-full bg-[#138808]"></div>
                  </div>

                  {/* Overlay Gradient for premium feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/40 via-transparent to-transparent pointer-events-none z-10"></div>


                  {/* Decorative Sparkles */}
                  <Sparkles className="absolute top-6 left-6 text-yellow-400 w-8 h-8 animate-pulse z-20" />
                </div>
              </div>

              {/* Floating Finance Icons & Cards */}

              {/* Card 1: Shield Security */}
              <div
                className="absolute -top-6 -left-4 lg:-left-12 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white flex items-center gap-4 animate-bounce hover:-translate-y-2 transition-transform"
                style={{ animationDuration: "4s", animationDelay: "0.5s" }}
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    100% Secure
                  </div>
                  <div className="text-sm font-extrabold text-slate-800">
                    Bank Grade
                  </div>
                </div>
              </div>

              {/* Card 2: Growth Chart */}
              <div
                className="absolute -bottom-8 -right-4 lg:-right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white flex items-center gap-4 animate-bounce hover:-translate-y-2 transition-transform"
                style={{ animationDuration: "5s", animationDelay: "1s" }}
              >
                <div className="w-12 h-12 bg-blue-100 text-[#003366] rounded-xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    High Returns
                  </div>
                  <div className="text-sm font-extrabold text-[#003366]">
                    +60% Bonus
                  </div>
                </div>
              </div>

              {/* Floating Wallet */}
              <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-xl border border-slate-100 animate-pulse hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8 text-[#003366]" />
              </div>

              {/* Floating Rupee */}
              <div
                className="absolute top-1/3 -left-6 transform -translate-y-1/2 bg-yellow-50 p-3 rounded-full shadow-xl border border-yellow-100 animate-pulse hover:scale-110 transition-transform"
                style={{ animationDelay: "1.5s" }}
              >
                <IndianRupee className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SMART SAVE */}
      <section id="benefits" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose SMART SAVE?
            </h2>
            <p className="text-lg text-slate-600">
              Experience a modern approach to daily savings with our
              comprehensive platform features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Secure Savings",
                desc: "Bank-grade security protocols ensuring your money is always safe.",
              },
              {
                icon: Wallet,
                title: "Digital Collection",
                desc: "Paperless digital receipts and instant SMS confirmation.",
              },
              {
                icon: Clock,
                title: "Daily Tracking",
                desc: "Monitor your daily deposits in real-time through the dashboard.",
              },
              {
                icon: BarChart4,
                title: "Transparent Reports",
                desc: "Detailed ledgers and statements available at your fingertips.",
              },
              {
                icon: KeyRound,
                title: "OTP Login Ready",
                desc: "Secure passwordless login using your registered mobile number.",
              },
              {
                icon: Smartphone,
                title: "Mobile Friendly",
                desc: "Access your account seamlessly from any device, anywhere.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-blue-50 text-[#003366] rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="about"
        className="py-20 bg-[#003366] text-white relative overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-full h-full opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-blue-100 text-lg">
              A simple 7-step journey to financial prosperity.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-800 -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 relative z-10">
              {[
                { step: 1, title: "Register" },
                { step: 2, title: "Verify Mobile" },
                { step: 3, title: "Complete Profile" },
                { step: 4, title: "Pay Daily ₹127" },
                { step: 5, title: "Complete 180 Days" },
                { step: 6, title: "Wait 3 Years" },
                { step: 7, title: "Receive Savings + Bonus" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-12 h-12 bg-blue-600 border-4 border-[#003366] rounded-full flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-white group-hover:text-[#003366] transition-colors shadow-lg z-10 relative">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-sm md:text-base text-blue-50 group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLAN HIGHLIGHT */}
      <section id="plan" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                SMART SAVE <br />
                <span className="text-[#003366]">BASIC PLAN</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Our core saving plan is designed to be affordable while offering
                maximum returns over time. Start building your wealth with
                micro-daily deposits.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  {
                    label: "Registration Fee",
                    value: "₹2,500 (One Time)",
                    highlight: true,
                  },
                  { label: "Daily Saving", value: "₹127" },
                  { label: "Member Saving", value: "₹102" },
                  { label: "Company Collection", value: "₹25" },
                  { label: "Payment Period", value: "180 Days" },
                  { label: "Waiting Period", value: "3 Years" },
                  { label: "Bonus", value: "60%", highlight: true },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-slate-600 font-medium">
                      {row.label}
                    </span>
                    <span
                      className={`font-bold ${row.highlight ? "text-[#003366]" : "text-slate-800"}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="bg-[#003366] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#002244] transition-colors"
                >
                  Register Now
                </Link>
                <Link
                  to="/login"
                  className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                >
                  View Full Plan
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#003366]/10 to-transparent rounded-3xl transform translate-x-4 translate-y-4"></div>
              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative">
                <div className="w-16 h-16 bg-blue-50 text-[#003366] rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Maximize Returns
                </h3>
                <p className="text-slate-600 mb-8">
                  Discipline is key. Complete your 180 daily deposits to unlock
                  the 60% maturity bonus.
                </p>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="text-sm font-medium text-slate-500 mb-1">
                    Estimated Maturity Value
                  </div>
                  <div className="text-4xl font-extrabold text-[#003366] mb-4">
                    ₹29,376
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Principal + 60% Bonus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATISTICS */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">
            {[
              { icon: Users, label: "Total Members", value: "5,240+" },
              { icon: Wallet, label: "Today's Collections", value: "₹6.4L" },
              { icon: Activity, label: "Active Plans", value: "4,800+" },
              {
                icon: CheckCircle2,
                label: "Completed Payments",
                value: "1,200+",
              },
            ].map((stat, idx) => (
              <div key={idx} className="p-6">
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-[#003366]" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-16">
            What Our Members Say
          </h2>

          <div className="max-w-4xl mx-auto relative">
            <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 relative">
              <QuoteIcon className="absolute top-8 left-8 text-blue-100 w-16 h-16 opacity-50" />
              <p className="text-xl md:text-2xl text-slate-700 italic font-medium relative z-10 leading-relaxed mb-8">
                "{testimonials[activeTestimonial].content}"
              </p>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {testimonials[activeTestimonial].name}
                </h4>
                <div className="text-[#003366] font-medium">
                  {testimonials[activeTestimonial].role}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handlePrevTestimonial}
                className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#003366] hover:text-white hover:border-[#003366] transition-colors shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextTestimonial}
                className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#003366] hover:text-white hover:border-[#003366] transition-colors shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about the SMART SAVE platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="font-semibold text-slate-800 pr-8">
                    {faq.question}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 pt-2 text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#003366] rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-2">
              <div className="p-10 md:p-16 text-white relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Get in Touch
                  </h2>
                  <p className="text-blue-100 mb-12 text-lg">
                    Have questions? Our support team is here to help you
                    navigate your savings journey.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-200">Phone</div>
                        <div className="font-semibold">+91 1800-SMART-SAVE</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-200">Email</div>
                        <div className="font-semibold">
                          support@smartsave.com
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-200">WhatsApp</div>
                        <div className="font-semibold">+91 98765 43210</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 md:p-16">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">
                  Send a Message
                </h3>
                <form
                  className="space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full border-slate-300 rounded-lg shadow-sm py-3 px-4 bg-slate-50 border focus:ring-[#003366] focus:border-[#003366] outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full border-slate-300 rounded-lg shadow-sm py-3 px-4 bg-slate-50 border focus:ring-[#003366] focus:border-[#003366] outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border-slate-300 rounded-lg shadow-sm py-3 px-4 bg-slate-50 border focus:ring-[#003366] focus:border-[#003366] outline-none resize-none"
                      placeholder="How can we help?"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-[#002244] transition-colors shadow-lg"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-blue-500 h-8 w-8" />
                <div className="font-extrabold text-2xl tracking-tight text-white">
                  SMART<span className="text-blue-500">SAVE</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                A trusted digital savings platform empowering individuals to
                build secure financial futures through disciplined daily
                savings.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection("home")}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("about")}
                    className="hover:text-blue-400 transition-colors"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("plan")}
                    className="hover:text-blue-400 transition-colors"
                  >
                    Our Plan
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("faq")}
                    className="hover:text-blue-400 transition-colors"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> 1800-SMART-SAVE
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> support@smartsave.com
                </li>
                <li className="flex items-start gap-2">
                  <Layout className="w-4 h-4 mt-1" /> 123 Finance Street,
                  Business Hub, City 400001
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
            <p>
              &copy; {new Date().getFullYear()} SMART SAVE Financial Systems.
              All rights reserved.
            </p>
            <p className="mt-2 md:mt-0">Designed for Secure Savings</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper SVG
function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}
