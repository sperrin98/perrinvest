import React, { useState } from 'react';
import './Returns.css';
import EcoDataPoint from './EcoDataPoint';
import AnnualReturns from './AnnualReturns';
import GoldReturns from './GoldReturns';
import SilverReturns from './SilverReturns';

const Returns = () => {
  const [selectedOption, setSelectedOption] = useState({ type: null, id: null });
  const nwHpiIds = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="returns-container">
      <div className="returns-sidebar">
        <div className="sidebar-scroll">
          <h3>Currencies priced in Gold/Silver</h3>
          <div className="option-list">
            <button
              onClick={() => setSelectedOption({ type: 'gold' })}
              className={selectedOption.type === 'gold' ? 'selected' : ''}
            >
              Gold Price Returns
            </button>
            <button
              onClick={() => setSelectedOption({ type: 'silver' })}
              className={selectedOption.type === 'silver' ? 'selected' : ''}
            >
              Silver Price Returns
            </button>
          </div>

          <h3>Annual Returns</h3>
          <div className="option-list">
            <button
              onClick={() => setSelectedOption({ type: 'annual' })}
              className={selectedOption.type === 'annual' ? 'selected' : ''}
            >
              Go to Annual Returns
            </button>
          </div>

          <h3>Nationwide House Price Indexes</h3>
          <div className="option-list">
            {nwHpiIds.map(id => (
              <button
                key={id}
                onClick={() => setSelectedOption({ type: 'eco-data', id })}
                className={selectedOption.type === 'eco-data' && selectedOption.id === id ? 'selected' : ''}
              >
                Nationwide HPI ID {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="returns-main-content">
        {selectedOption.type === 'gold' && (
          <div className="content-block">
            <h2>Gold Price Returns</h2>
            <div className="wrapper">
              <GoldReturns />
            </div>
          </div>
        )}

        {selectedOption.type === 'silver' && (
          <div className="content-block">
            <h2>Silver Price Returns</h2>
            <div className="wrapper">
              <SilverReturns />
            </div>
          </div>
        )}

        {selectedOption.type === 'annual' && (
          <div className="content-block">
            <h2>Annual Returns</h2>
            <div className="wrapper">
              <AnnualReturns />
            </div>
          </div>
        )}

        {selectedOption.type === 'eco-data' && selectedOption.id && (
          <div className="content-block">
            <h2>Nationwide HPI ID {selectedOption.id}</h2>
            <div className="wrapper">
              <EcoDataPoint id={selectedOption.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Returns;
