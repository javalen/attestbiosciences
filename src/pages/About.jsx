import React from "react";
import heroImg from "../assets/About.png";
import img1 from "../assets/about1.png";
import img2 from "../assets/about2.png";
import img3 from "../assets/about3.png";

const About = () => {
  return (
    <main className="w-full bg-white text-slate-900">
      <div className="pt-[120px] pb-24">
        <div className="max-w-6xl mx-auto px-8">
          {/* Page Title */}
          <h1 className="text-center text-[16px] tracking-[0.35em] font-semibold uppercase mb-16">
            About Attest BioSciences
          </h1>

          {/* Hero Image */}
          <div className="flex justify-center mb-16">
            <img
              src={heroImg}
              alt="Attest BioSciences hero"
              className="w-full max-w-5xl h-[420px] object-cover"
            />
          </div>

          {/* Vision Section */}
          <section className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-[16px] tracking-[0.30em] font-semibold uppercase mb-6">
              Our Vision for Your Health
            </h2>

            <p className="text-[16px] leading-8 text-slate-700">
              At Attest BioSciences, we are committed to transforming the
              landscape of medical testing. Our mission is to make health
              testing more accessible and affordable for everyone, empowering
              you to take control of your health from the comfort of your own
              home. We believe that early detection and proactive health
              management are crucial for better outcomes, and we are dedicated
              to providing innovative solutions to support those goals.
            </p>
          </section>

          {/* Two Feature Blocks */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
            {/* Left */}
            <div className="text-center">
              <img
                src={img1}
                alt="Cancer screening focus"
                className="w-full h-[300px] object-cover"
              />

              <h3 className="mt-8 text-[15px] tracking-[0.30em] font-semibold uppercase">
                Our Focus on Cancer Screening
              </h3>

              <p className="mt-5 text-[15px] leading-8 text-slate-700 px-6">
                Our primary focus is on advanced cancer screening. Our flagship
                product is designed to identify a specific biomarker unique to
                certain cancer types, enabling earlier detection of multiple
                types of cancer with a single test. This groundbreaking approach
                aims to revolutionize how we detect cancer at an early stage,
                potentially saving lives.
              </p>
            </div>

            {/* Right */}
            <div className="text-center">
              <img
                src={img2}
                alt="Expanding health testing"
                className="w-full h-[300px] object-cover"
              />

              <h3 className="mt-8 text-[15px] tracking-[0.30em] font-semibold uppercase">
                Expanding Health Testing
              </h3>

              <p className="mt-5 text-[15px] leading-8 text-slate-700 px-6">
                While our initial emphasis is on cancer, we recognize the
                importance of comprehensive health monitoring. In addition to
                cancer screening, we offer a variety of other health tests
                including cardiac health assessments, diabetes management tests,
                allergy testing, and STD/STI screening.
              </p>
            </div>
          </section>

          {/* Large Image */}
          <section className="mb-16">
            <img
              src={img3}
              alt="Our commitment to innovation"
              className="w-full h-[500px] object-cover"
            />
          </section>

          {/* Commitment Section */}
          <section className="text-center max-w-4xl mx-auto">
            <h2 className="text-[16px] tracking-[0.30em] font-semibold uppercase mb-6">
              Our Commitment to Innovation
            </h2>

            <p className="text-[16px] leading-8 text-slate-700">
              At Attest BioSciences, innovation and excellence are at the heart
              of what we do. Our team is driven by a passion for enhancing your
              health journey through trusted health management tools. We are
              continuously working to advance our testing solutions and ensure
              that you can achieve the best possible care.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default About;
