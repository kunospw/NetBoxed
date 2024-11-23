import React from 'react'
import './Footer.css'
import Yt_icon from '../../assets/youtube_icon.png'
import X_icon from '../../assets/twitter_icon.png'
import Ig_icon from '../../assets/instagram_icon.png'
import Fb_icon from '../../assets/facebook_icon.png'

const Footer = () => {
  return (
    <div className='footer'>
      <div className="footer-icons">
        <img src={Yt_icon} alt="" />
        <img src={X_icon} alt="" />
        <img src={Ig_icon} alt="" />
        <img src={Fb_icon} alt="" />
      </div>
      <ul>
        <li>Audio Description</li>
        <li>Help Center</li>
        <li>Gift Cards</li>
        <li>Media Center</li>
        <li>Inverstor Relations</li>
        <li>Jobs</li>
        <li>Terms of User</li>
        <li>Privacy</li>
        <li>Legal Notices</li>
        <li>Cookie Preferences</li>
        <li>Corporate Information</li>
        <li>Contact Us</li>
      </ul>
      <p className='copyright-text'>© NetBoxed 2024</p>
    </div>
  )
}

export default Footer