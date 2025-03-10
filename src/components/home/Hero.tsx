
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui-custom/Button';
import { fadeInDown, fadeInUp, staggerContainer } from '@/lib/animations';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-36 pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-background -z-10" />
      
      {/* Abstract shapes */}
      <motion.div 
        className="absolute -top-20 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
      <motion.div 
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />
      
      <div className="container px-6 mx-auto">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInDown}>
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium rounded-full bg-accent text-accent-foreground">
              TikTok Shop Data Analysis Tool
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            variants={fadeInDown}
          >
            Extract Valuable Insights from TikTok Shop Data
          </motion.h1>
          
          <motion.p 
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
            variants={fadeInDown}
          >
            Analyze shop performance, track product sales, and calculate revenue with a powerful, elegant crawler that simplifies TikTok Shop data extraction.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={fadeInUp}
          >
            <Link to="/dashboard">
              <Button 
                size="lg" 
                icon={<ArrowRight size={18} />} 
                iconPosition="right"
              >
                Get Started
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              as="a" 
              href="#features"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Dashboard preview image */}
        <motion.div
          className="mt-20 relative mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.4,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <div className="relative rounded-xl overflow-hidden border shadow-2xl">
            <div className="aspect-[16/9] bg-secondary/30 backdrop-blur-sm flex items-center justify-center">
              <p className="text-muted-foreground text-center p-12">Dashboard Preview</p>
            </div>
            
            {/* Glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent pointer-events-none" />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
