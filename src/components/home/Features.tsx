
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Database, Download, LineChart, Search, ShoppingBag } from 'lucide-react';
import Card from '../ui-custom/Card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ delay }}
      className="h-full"
    >
      <Card hover className="h-full">
        <div className="flex flex-col h-full">
          <div className="p-3 mb-4 rounded-lg w-fit bg-primary/10">
            <div className="text-primary">{icon}</div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </Card>
    </motion.div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Search size={24} />,
      title: 'Intelligent Crawling',
      description: 'Automatically crawl TikTok Shop pages to gather comprehensive shop and product information.',
    },
    {
      icon: <ShoppingBag size={24} />,
      title: 'Product Extraction',
      description: 'Extract detailed product data including names, prices, and sales counts from TikTok Shops.',
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Revenue Calculation',
      description: 'Automatically calculate estimated total revenue, items sold, and per-product revenue metrics.',
    },
    {
      icon: <Database size={24} />,
      title: 'SQL Database Storage',
      description: 'Store all extracted data in a structured SQL database for reliable persistence and analysis.',
    },
    {
      icon: <LineChart size={24} />,
      title: 'Data Visualization',
      description: 'View beautiful, interactive charts and tables to analyze shop performance and trends.',
    },
    {
      icon: <Download size={24} />,
      title: 'Excel Export',
      description: 'Export all your data and calculations to Excel spreadsheets for further analysis and reporting.',
    },
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container px-6 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-sm font-medium text-primary mb-3 inline-block">
            Key Features
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-6">
            Everything you need for TikTok Shop analysis
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg">
            Our tool provides a complete solution for extracting, analyzing, and visualizing TikTok Shop data.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
