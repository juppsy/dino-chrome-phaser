import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PreloadScene from '../scenes/PreloadScene';
import PlayScene from '../scenes/PlayScene';

const Game: React.FC = () => {
	const gameRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (gameRef.current) {
			const config: Phaser.Types.Core.GameConfig = {
				type: Phaser.AUTO,
				width: 1000,
				height: 340,
				parent: gameRef.current,
				pixelArt: true,
				transparent: true,
				physics: {
					default: 'arcade',
					arcade: {
						debug: false,
					},
				},
				scene: [PreloadScene, PlayScene],
			};

			const game = new Phaser.Game(config);

			return () => {
				game.destroy(true);
			};
		}
	}, []);

	return <div ref={gameRef} />;
};

export default Game;
