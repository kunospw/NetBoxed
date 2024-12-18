import React from 'react'
import './Player.css'
import back_arrow from '../../assets/back_arrow_icon.png'

const Player = () => {
  return (
    <div className='player'>
      <img src={back_arrow} alt=''/>
      <iframe width='90%' height='90%'
      src='https://www.youtube.com/embed/oUcE_5Gv_YE'
      title='trailer' frameBorder='0' allowFullScreen></iframe>
      <div className="player-info">
        <p>Public Date</p>
        <p>Name</p>
        <p>Type</p>
      </div>
    </div>
  )
}

export default Player