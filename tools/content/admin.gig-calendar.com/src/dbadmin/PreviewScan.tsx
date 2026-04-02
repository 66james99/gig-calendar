import React from 'react';
import { ScanResult, MatchedResult } from './types';

const getConfidenceStyle = (conf: number) => {
    let color = 'red';
    if (conf === 100) color = 'green';
    else if (conf === 75) color = 'blue';
    else if (conf === 50) color = 'orange';
    else if (conf === 25) color = 'gray';
    return { color, fontWeight: conf > 0 ? 'bold' : 'normal' as any, cursor: 'pointer', textDecoration: 'underline dotted' };
};

export const PreviewScan: React.FC<{ result: ScanResult; isDebug: boolean }> = ({ result, isDebug }) => {
    return (
        <div className="preview-content">
            <h4>Summary</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <li><strong>Parsed:</strong> {result.success_count}</li>
                <li><strong>Inconsistent:</strong> {result.inconsistent_count}</li>
                <li><strong>Failed:</strong> {result.error_count}</li>
                <li><strong>Ignored:</strong> {result.ignored_count}</li>
            </ul>

            {isDebug && result.error_count > 0 && (
                <details>
                    <summary style={{ cursor: 'pointer', color: 'red' }}>Show Parse Errors ({result.error_count})</summary>
                    <pre style={{ maxHeight: '100px', overflowY: 'auto', background: '#fff0f0', padding: '10px', fontSize: '0.8em' }}>
                        {(result.parse_errors || []).join('\n')}
                    </pre>
                </details>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #ccc', zIndex: 1 }}>
                        <tr>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Performers</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Venue</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Promoters</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>OK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(result.successes || []).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '6px' }}>
                                    {item.year}-{String(item.month).padStart(2, '0')}-{String(item.day).padStart(2, '0')}
                                </td>
                                <td style={{ padding: '6px' }}>
                                    {item.performers?.map((group, gIdx) => (
                                        <span key={gIdx}>
                                            {group.map((p, pIdx) => {
                                                const conf = p.confidence || 0;
                                                const display = conf > 0 ? p.match : p.name;
                                                return (
                                                    <span key={pIdx}>
                                                        {p.pattern && <span> {p.pattern} </span>}
                                                        <span 
                                                            style={getConfidenceStyle(conf)} 
                                                            title={conf !== 100 ? `Original: ${p.name}` : ''}
                                                            onClick={() => window.open(`../performer/?action=new&name=${encodeURIComponent(p.name)}`, '_blank')}
                                                        >
                                                            {display}
                                                        </span>
                                                    </span>
                                                );
                                            })}
                                            {gIdx < (item.performers?.length || 0) - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </td>
                                <td style={{ padding: '6px' }}>
                                    {item.venue && (
                                        <span 
                                            style={getConfidenceStyle(item.venue.confidence)}
                                            title={item.venue.confidence !== 100 ? `Original: ${item.venue.name}` : ''}
                                            onClick={() => window.open(`../venue/?action=new&name=${encodeURIComponent(item.venue!.name)}`, '_blank')}
                                        >
                                            {item.venue.confidence > 0 ? item.venue.match : item.venue.name}
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '6px' }}>
                                    {item.promoters?.map((p, pIdx) => (
                                        <span key={pIdx}>
                                            <span 
                                                style={{
                                                    ...getConfidenceStyle(p.confidence),
                                                    textDecoration: p.festival ? 'underline' : 'underline dotted'
                                                }}
                                                title={p.confidence !== 100 ? `Original: ${p.name}` : ''}
                                                onClick={() => window.open(`../promoter/?action=new&name=${encodeURIComponent(p.name)}`, '_blank')}
                                            >
                                                {p.confidence > 0 ? p.match : p.name}
                                            </span>
                                            {pIdx < (item.promoters?.length || 0) - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </td>
                                <td style={{ 
                                    padding: '6px', 
                                    textAlign: 'center', 
                                    color: item.consistent ? 'green' : 'red', 
                                    fontWeight: 'bold' 
                                }}>
                                    {item.consistent ? '✓' : '✗'}
                                </td>
                            </tr>
                        ))}
                        {(!result.successes || result.successes.length === 0) && (
                            <tr><td colSpan={5} style={{ padding: '10px', textAlign: 'center' }}>No results found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};