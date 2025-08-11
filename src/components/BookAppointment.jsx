import { useState } from "react";
import {
  FaTooth,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaChevronRight,
} from "react-icons/fa";
import { GiToothbrush } from "react-icons/gi";

const BookAppointment = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    service: "General Testing",
  });

  const services = [
    "General Testing",
    "Processing time information",
    "How it works",
    "Testing centers?",
    "Which test is best for me?",
  ];

  const availableTimes = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setActiveStep((prev) => prev + 1);
  const prevStep = () => setActiveStep((prev) => prev - 1);

  return (
    <div
      id="book"
      className="scroll-mt-20 min-h-screen bg-gradient-to-br from-sky-50 to-sky-50 py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            PreOrder your test today
          </h1>
          <p className="text-lg text-gray-600">
            Talk with a professional to discuss what test are right for you.
          </p>
        </div>

        {/* Improved Step Indicator */}
        <div className="mb-12">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-100 rounded-full z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-sky-400 to-sky-400 
              rounded-full z-10 transition-all duration-500"
              style={{ width: `${(activeStep - 1) * 50}%` }}
            ></div>

            {/* Steps */}
            <div className="flex justify-between relative z-20">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => activeStep > step && setActiveStep(step)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                    ${
                      activeStep >= step
                        ? "bg-gradient-to-br from-sky-500 to-sky-500 text-white shadow-lg"
                        : "bg-white text-gray-300 border-2 border-gray-200"
                    } 
                    transition-all duration-300 font-bold mb-2`}
                  >
                    {activeStep > step ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      activeStep >= step ? "text-sky-600" : "text-gray-400"
                    } transition-colors`}
                  >
                    {["Your Info", "Schedule", "Confirm"][step - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {activeStep === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaUser className="mr-3 text-sky-500" />
                Personal Information
              </h2>
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-sky-500
                     focus:ring-2 focus:ring-sky-200 outline-none transition"
                    required
                  />
                  <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl
                     focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
                    required
                  />
                  <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FaCalendarAlt className="mr-3 text-sky-500" />
                Appointment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl
                     focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative">
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-sky-500
                     focus:ring-2 focus:ring-sky-200 outline-none appearance-none transition"
                    required
                  >
                    <option value="">Select Time</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <FaClock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <FaChevronRight
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90
                   text-gray-400"
                  />
                </div>
                <div className="relative md:col-span-2">
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl
                     focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none
                      appearance-none transition"
                    required
                  >
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <FaTooth className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <FaChevronRight
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 
                  rotate-90 text-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center bg-sky-100 p-6 rounded-full mb-6">
                <GiToothbrush className="text-4xl text-sky-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Confirm Your Appointment
              </h2>
              <div className="bg-sky-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
                <div className="flex justify-between py-2 border-b border-sky-100">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sky-100">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{formData.phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sky-100">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formData.date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sky-100">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{formData.time}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{formData.service}</span>
                </div>
              </div>
              <button
                className="w-full max-w-xs py-4 bg-gradient-to-r from-sky-500 to-sky-500
               text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Confirm & Book Appointment
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="px-8 pb-8 flex justify-between">
            {activeStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Back
              </button>
            )}
            {activeStep < 3 && (
              <button
                onClick={nextStep}
                className="ml-auto px-6 py-3 bg-sky-500 text-white font-medium rounded-lg
                 hover:bg-sky-600 transition flex items-center"
              >
                Next <FaChevronRight className="ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
