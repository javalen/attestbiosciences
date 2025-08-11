import { FaTooth, FaSmileBeam, FaXRay } from "react-icons/fa";
import { GrTest, GrDocumentTest, GrTestDesktop } from "react-icons/gr";
import { GiToothbrush } from "react-icons/gi";
import { SiVitest } from "react-icons/si";
import { motion } from "framer-motion";

const services = [
  {
    icon: <GrTest className="w-10 h-10 text-sky-500" />,
    title: "At-Home Multi-Cancer Screening",
    description:
      "Single-biomarker test designed to detect signals uniquely present in cancer cells for earlier, more convenient screening from home.",
  },
  {
    icon: <GrDocumentTest className="w-10 h-10 text-green-500" />,
    title: "DNA Relationship (Legal Paternity) Testing",
    description:
      "Accurate DNA testing with chain-of-custody options for legal use and clear documentation of results.",
  },
  {
    icon: <SiVitest className="w-10 h-10 text-yellow-500" />,
    title: "Cardiovascular & Infectious Disease Screening",
    description:
      "Laboratory testing services that support screening and detection for select cardiovascular and infectious conditions.",
  },
  {
    icon: <GrTestDesktop className="w-10 h-10 text-purple-500" />,
    title: "Simplified At-Home Collection & Reporting",
    description:
      "Easy at-home sample collection with clear, accessible results and guidance on next steps.",
  },
];

const Services = () => {
  return (
    <section
      className="scroll-mt-20 py-24 bg-gradient-to-br from-white to-sky-50"
      id="services"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-sky-900 mb-4">
            Our Testing Services
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We offer a full range of genetic testing using the latest
            technologies to ensure your comfort and care.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-all border
               border-sky-100 hover:border-sky-300"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-center mb-4">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-sky-800 mb-2 text-center">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm text-center">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
