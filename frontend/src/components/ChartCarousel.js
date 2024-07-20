import React from 'react';
import { Carousel } from 'react-bootstrap';
import GoldPriceChart from './GoldPriceChart';
import BitcoinPriceChart from './BitcoinPriceChart';
import USDPriceChart from './USDPriceChart';
import SP500PriceChart from './SP500PriceChart';
import ApplePriceChart from './ApplePriceChart';

const ChartCarousel = () => {
  return (
    <Carousel className="chart-carousel">
      <Carousel.Item>
        <div className="d-flex justify-content-center chart-container">
          <GoldPriceChart />
        </div>
        <Carousel.Caption>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <div className="d-flex justify-content-center chart-container">
          <BitcoinPriceChart />
        </div>
        <Carousel.Caption>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <div className="d-flex justify-content-center chart-container">
          <USDPriceChart />
        </div>
        <Carousel.Caption>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <div className="d-flex justify-content-center chart-container">
          <SP500PriceChart />
        </div>
        <Carousel.Caption>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <div className="d-flex justify-content-center chart-container">
          <ApplePriceChart />
        </div>
        <Carousel.Caption>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
};

export default ChartCarousel;
