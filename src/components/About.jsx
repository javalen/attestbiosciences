import { FaUserMd } from "react-icons/fa";
import aboutImg from "../assets/About.png";
import about1 from "../assets/about1.png";
import about2 from "../assets/about2.png";
import about3 from "../assets/about3.png";

const About = () => {
  return (
    <section className="py-20 scroll-mt-20 bg-sky-50" id="about">
      <div
        className="container mx-auto px-4 flex flex-col-reverse 
      lg:flex-row items-center gap-12"
      >
        {/* Left Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={aboutImg}
            alt="About Attest BioSciences"
            className="w-80 lg:w-[420px] rounded-full shadow-md"
          />
        </div>

        {/* Right Text Content */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <FaUserMd className="text-sky-600 w-7 h-7" />
            <h2 className="text-3xl font-bold text-sky-900">
              Our Vision for Your Health
            </h2>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            At Attest BioSciences, we are committed to transforming the
            landscape of medical testing. Our mission is to make health testing
            more accessible and affordable for everyone, empowering you to take
            control of your health from the comfort of your own home. We believe
            that early detection and proactive health management are crucial for
            better outcomes, and we’re dedicated to providing innovative
            solutions to support these goals.
          </p>
        </div>
      </div>

      <div
        className="container mx-auto px-4 flex flex-col-reverse 
      lg:flex-row items-center gap-12 mt-10"
      >
        {/* Right Text Content */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <FaUserMd className="text-sky-600 w-7 h-7" />
            <h2 className="text-3xl font-bold text-sky-900">
              Our Focus on Cancer Screening
            </h2>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our primary focus is on advanced at-home cancer screening. Our
            flagship product is designed to identify a specific biomarker
            uniquely present in cancer cells, enabling earlier detection of
            multiple types of cancer with a single test. This streamlines the
            process and enhances convenience for you. By identifying cancer
            cells at an early stage, we provide essential information that
            supports effective management and treatment. This unique approach
            allows us to offer a broader range of cancer detection than
            traditional tests, giving you a valuable tool for proactive health
            management.
          </p>
        </div>
        {/* Left Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={about1}
            alt="About Attest BioSciences"
            className="w-80 lg:w-[420px] rounded-full shadow-md"
          />
        </div>
      </div>

      <div
        className="container mx-auto px-4 flex flex-col-reverse 
      lg:flex-row items-center gap-12 mt-10"
      >
        {/* Left Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={about2}
            alt="About Attest BioSciences"
            className="w-80 lg:w-[420px] rounded-full shadow-md"
          />
        </div>

        {/* Right Text Content */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <FaUserMd className="text-sky-600 w-7 h-7" />
            <h2 className="text-3xl font-bold text-sky-900">
              Expanding Health Testing
            </h2>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            While our initial emphasis is on cancer, we recognize the importance
            of comprehensive health monitoring. In addition to cancer screening,
            we offer a variety of other health tests including cardiac health
            assessments, diabetes management tests, allergy testing, and STD/STI
            testing. Our aim is to broaden access to essential medical tests and
            reduce their costs, helping you maintain various aspects of your
            health with ease and affordability.
          </p>
        </div>
      </div>

      <div
        className="container mx-auto px-4 flex flex-col-reverse 
      lg:flex-row items-center gap-12 mt-10"
      >
        {/* Right Text Content */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-2">
            <FaUserMd className="text-sky-600 w-7 h-7" />
            <h2 className="text-3xl font-bold text-sky-900">
              Our Commitment to Innovation
            </h2>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            At Attest BioSciences, innovation and excellence are at the heart of
            what we do. Our team is driven by a passion for enhancing lives
            through improved health management. We are continuously working to
            advance our testing solutions and ensure that you receive the best
            possible care. Join us on our journey to make health testing more
            accessible, affordable, and effective, and let’s work together
            towards a healthier future.
          </p>
        </div>

        {/* Left Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={about3}
            alt="About Attest BioSciences"
            className="w-80 lg:w-[420px] rounded-full shadow-md"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
