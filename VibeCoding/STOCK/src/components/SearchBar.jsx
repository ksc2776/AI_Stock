import React, { useState, useEffect, useRef } from 'react';
import koreaStocks from '../data/koreaStocks.json';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // 외부 클릭 시 드롭다운 닫기
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerValue = value.toLowerCase();
    
    // 종목명 또는 종목코드 매칭 (최대 10개)
    let filtered = koreaStocks.filter(stock => 
      (stock.name && stock.name.toLowerCase().includes(lowerValue)) || 
      (stock.code && stock.code.includes(lowerValue))
    );

    // 추가 매칭: 공백/특수문자 제거 후 비교, 부분 매칭 허용
    if (filtered.length === 0) {
      const qNoSpace = lowerValue.replace(/\s+/g, '');
      filtered = koreaStocks.filter(stock => {
        const name = (stock.name || '').toLowerCase();
        const nameNoSpace = name.replace(/\s+/g, '');
        // NFC 정규화
        const normName = name.normalize ? name.normalize('NFC') : name;
        const normQuery = qNoSpace.normalize ? qNoSpace.normalize('NFC') : qNoSpace;
        return nameNoSpace.includes(normQuery) || normName.includes(lowerValue);
      });
    }

    filtered = filtered.slice(0, 10);
    setResults(filtered);
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      // 드롭다운이 안열려있을때 엔터치면, 정확히 매치되는게 있는지 확인하고 검색
      if (e.key === 'Enter' && query.trim() !== '') {
        const exactMatch = koreaStocks.find(s => s.code === query || s.name === query);
        if (exactMatch) {
          handleSelect(exactMatch);
        } else {
          // 일치하는게 없으면 임의 검색 시도
          onSearch(query.trim());
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        // 선택안하고 엔터치면 첫번째 항목
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (stock) => {
    setQuery(stock.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch(stock.code); // 종목코드로 검색
  };

  return (
    <div className="search-bar-container" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          className="search-input" 
          placeholder="종목명 또는 코드 검색 (예: 삼성전자, 005930)" 
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul className="search-dropdown">
          {results.map((stock, index) => (
            <li 
              key={stock.code} 
              className={`search-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(stock)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="sd-name">{stock.name}</span>
              <span className="sd-code">{stock.code}</span>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && query.trim() !== '' && results.length === 0 && (
        <ul className="search-dropdown">
          <li className="search-dropdown-item empty">검색 결과가 없습니다.</li>
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
