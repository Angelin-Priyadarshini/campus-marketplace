import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, HeartHandshake, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 text-gray-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              Campus<span className="text-primary">Mart</span>
            </span>
            <p className="text-gray-500 leading-relaxed">
              The verified peer-to-peer campus marketplace for students of SSN College of Engineering.
            </p>
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <MapPin size={14} className="text-primary" />
              <span>SSN College of Engineering, Kalavakkam</span>
            </div>
          </div>

          {/* Pillars */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 uppercase tracking-wider text-[11px]">
              Safety First
            </h4>
            <ul className="space-y-2 text-gray-500">
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-600" />
                Verified SSN Student Emails
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake size={14} className="text-blue-600" />
                In-Person Campus Handover
              </li>
              <li>Always meet in public campus zones</li>
              <li>Never pay in advance</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 uppercase tracking-wider text-[11px]">
              Marketplace
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Browse All Categories
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-primary transition-colors">
                  Open a Storefront
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-primary transition-colors">
                  My Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition-colors">
                  Order Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Course Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 uppercase tracking-wider text-[11px]">
              Course Project
            </h4>
            <p className="text-gray-500 leading-relaxed mb-2">
              UIT2739 – Full Stack Development (2025–26)
              <br />
              Department of Information Technology
            </p>
            <p className="text-[11px] text-gray-400">
              Angelin Priyadarshini Mariappan (3122235002011)
              <br />
              Balakkrishnan Govindhraj (3122235002024)
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} CampusMart. All rights reserved.</p>
          <p className="text-[11px]">Designed & built for SSN College of Engineering students.</p>
        </div>
      </div>
    </footer>
  )
}
