import React from 'react';
import Game from './components/Game';
import './App.css';

const App: React.FC = () => {
	return (
		<div className='App'>
			<header className='App-header'>
				<h1>Chrome Dino Game</h1>
			</header>
			<main>
				<Game />
			</main>
			<footer>
				<p>Created with React and Phaser</p>
			</footer>
		</div>
	);
};

export default App;
