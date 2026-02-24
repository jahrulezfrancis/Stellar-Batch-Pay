"use client";

import { motion } from "framer-motion";

const workflows = [
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17 20H7C4.79 20 3 18.21 3 16V8C3 5.79 4.79 4 7 4H17C19.21 4 21 5.79 21 8V16C21 18.21 19.21 20 17 20Z"
          stroke="#7C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12Z"
          stroke="#7C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 9H21"
          stroke="#7C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 4L5 8"
          stroke="#7C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4L19 8"
          stroke="#7C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconBg: "#7C6EF520",
    title: "Payroll & Contractor Payouts",
    description:
      "Pay your global team and freelancers instantly with automated batch processing.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill="#A855F7"
          stroke="#A855F7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconBg: "#A855F720",
    title: "Affiliate & Influencer Rewards",
    description:
      "Distribute commissions and rewards to your marketing partners efficiently.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="8"
          width="8"
          height="8"
          rx="1"
          stroke="#00D98B"
          strokeWidth="1.5"
        />
        <rect
          x="13"
          y="3"
          width="5"
          height="5"
          rx="1"
          stroke="#00D98B"
          strokeWidth="1.5"
        />
        <rect
          x="13"
          y="13"
          width="5"
          height="8"
          rx="1"
          stroke="#00D98B"
          strokeWidth="1.5"
        />
        <path
          d="M3 4H9"
          stroke="#00D98B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M6 4V8"
          stroke="#00D98B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    iconBg: "#00D98B20",
    title: "Community Incentive Programs",
    description:
      "Reward community members and token holders with seamless distributions.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 8.5C2 6.01 4.01 4 6.5 4C7.96 4 9.25 4.69 10.1 5.76"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.9 5.76C14.75 4.69 16.04 4 17.5 4C19.99 4 22 6.01 22 8.5C22 11.65 19.11 14.22 14.64 18.23L12 20.65L9.36 18.22C4.89 14.22 2 11.65 2 8.5Z"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 10L11 13L16 8"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconBg: "#F9731620",
    title: "Vendor & Supplier Payments",
    description:
      "Streamline accounts payable with automated vendor payment processing.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="9" stroke="#22D3EE" strokeWidth="1.5" />
        <path
          d="M8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M9 15.5C9.88 16.44 11.14 17 12.5 17C14.16 17 15.62 16.2 16.5 14.97"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 8.5V7"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8 10L6.5 9"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 10L17.5 9"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    iconBg: "#22D3EE20",
    title: "Crypto Project Treasury",
    description: "Manage token distributions and treasury operations at scale.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 20V10"
          stroke="#EC4899"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 20V4"
          stroke="#EC4899"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 20V14"
          stroke="#EC4899"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconBg: "#EC489920",
    title: "Investment Distributions",
    description:
      "Distribute dividends and returns to multiple investors simultaneously.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PaymentWorkflowsSection() {
  return (
    <section
      style={{ backgroundColor: "#0A0E1A", width: "100%" }}
      className="py-20 px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ color: "#ffffff" }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5"
        >
          Designed for{" "}
          <span style={{ color: "#00D98B" }}>Real Payment Workflows</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ color: "#8B92B0" }}
          className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
        >
          Trusted by teams across industries for their most critical payment
          operations.
        </motion.p>
      </div>

      {/* Cards Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {workflows.map(({ icon, iconBg, title, description }) => (
          <motion.div
            key={title}
            variants={item}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{
              backgroundColor: "#12172680",
              border: "1px solid #252B3D",
              borderRadius: "16px",
            }}
            className="p-7 flex flex-col gap-7 cursor-default"
          >
            {/* Icon Box */}
            <div
              style={{
                backgroundColor: iconBg,
                borderRadius: "12px",
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2">
              <h3
                style={{ color: "#ffffff" }}
                className="font-bold text-base sm:text-lg leading-snug"
              >
                {title}
              </h3>
              <p
                style={{ color: "#8B92B0" }}
                className="text-sm leading-relaxed"
              >
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
