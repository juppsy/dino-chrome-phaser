import Phaser from 'phaser';

class PlayScene extends Phaser.Scene {
	private dino!: Phaser.Physics.Arcade.Sprite;
	private obstacles!: Phaser.Physics.Arcade.Group;
	private ground!: Phaser.GameObjects.TileSprite;
	private startTrigger!: Phaser.Physics.Arcade.Sprite;
	private gameOverScreen!: Phaser.GameObjects.Container;
	private restart!: Phaser.GameObjects.Image;
	private scoreText!: Phaser.GameObjects.Text;
	private highScoreText!: Phaser.GameObjects.Text;
	private environment!: Phaser.GameObjects.Group;

	private gameSpeed!: number;
	private isGameRunning!: boolean;
	private respawnTime!: number;
	private score!: number;

	private jumpSound!: Phaser.Sound.BaseSound;
	private hitSound!: Phaser.Sound.BaseSound;
	private reachSound!: Phaser.Sound.BaseSound;

	constructor() {
		super('PlayScene');
	}

	create() {
		const { height, width } = this.game.config;
		this.gameSpeed = 10;
		this.isGameRunning = false;
		this.respawnTime = 0;
		this.score = 0;

		this.jumpSound = this.sound.add('jump', { volume: 0.2 });
		this.hitSound = this.sound.add('hit', { volume: 0.2 });
		this.reachSound = this.sound.add('reach', { volume: 0.2 });

		this.startTrigger = this.physics.add
			.sprite(0, 10, 'dino-idle')
			.setOrigin(0, 1)
			.setImmovable()
			.setVisible(false);
		this.ground = this.add
			.tileSprite(0, height as number, 88, 26, 'ground')
			.setOrigin(0, 1);
		this.dino = this.physics.add
			.sprite(0, height as number, 'dino-idle')
			.setCollideWorldBounds(true)
			.setGravityY(5000)
			.setBodySize(44, 92)
			.setDepth(1)
			.setOrigin(0, 1);

		this.scoreText = this.add
			.text(width as number, 0, '00000', {
				color: '#535353',
				font: '900 35px Courier',
				resolution: 5,
			})
			.setOrigin(1, 0)
			.setAlpha(0);

		this.highScoreText = this.add
			.text((width as number) - 200, 0, '00000', {
				color: '#535353',
				font: '900 35px Courier',
				resolution: 5,
			})
			.setOrigin(1, 0)
			.setAlpha(0);

		this.environment = this.add.group();
		this.environment.addMultiple([
			this.add.image((width as number) / 2, 170, 'cloud'),
			this.add.image((width as number) - 80, 80, 'cloud'),
			this.add.image((width as number) / 1.3, 100, 'cloud'),
		]);
		this.environment.setAlpha(0);

		this.gameOverScreen = this.add
			.container((width as number) / 2, (height as number) / 2 - 50)
			.setAlpha(0);
		this.gameOverScreen.add(this.add.image(0, 0, 'game-over'));
		this.restart = this.add.image(0, 80, 'restart').setInteractive();
		this.gameOverScreen.add(this.restart);

		this.obstacles = this.physics.add.group();

		this.initAnims();
		this.initStartTrigger();
		this.initColliders();
		this.handleInputs();
		this.handleScore();
	}

	initColliders() {
		this.physics.add.collider(
			this.dino,
			this.obstacles,
			() => {
				this.highScoreText.x = this.scoreText.x - this.scoreText.width - 20;

				const highScore = this.highScoreText.text.substr(
					this.highScoreText.text.length - 5
				);
				const newScore =
					Number(this.scoreText.text) > Number(highScore)
						? this.scoreText.text
						: highScore;

				this.highScoreText.setText('HI ' + newScore);
				this.highScoreText.setAlpha(1);

				this.physics.pause();
				this.isGameRunning = false;
				this.anims.pauseAll();
				this.dino.setTexture('dino-hurt');
				this.respawnTime = 0;
				this.gameSpeed = 10;
				this.gameOverScreen.setAlpha(1);
				this.score = 0;
				this.hitSound.play();
			},
			undefined,
			this
		);
	}

	initStartTrigger() {
		const { width, height } = this.game.config;
		this.physics.add.overlap(
			this.startTrigger,
			this.dino,
			() => {
				if (this.startTrigger.y === 10) {
					this.startTrigger.body?.reset(0, height as number);
					return;
				}

				this.startTrigger.disableBody(true, true);

				const startEvent = this.time.addEvent({
					delay: 1000 / 60,
					loop: true,
					callbackScope: this,
					callback: () => {
						this.dino.setVelocityX(80);
						this.dino.play('dino-run', true);

						if (this.ground.width < (width as number)) {
							this.ground.width += 17 * 2;
						}

						if (this.ground.width >= 1000) {
							this.ground.width = width as number;
							this.isGameRunning = true;
							this.dino.setVelocityX(0);
							this.scoreText.setAlpha(1);
							this.environment.setAlpha(1);
							startEvent.remove();
						}
					},
				});
			},
			undefined,
			this
		);
	}

	initAnims() {
		this.anims.create({
			key: 'dino-run',
			frames: this.anims.generateFrameNumbers('dino', { start: 2, end: 3 }),
			frameRate: 10,
			repeat: -1,
		});

		this.anims.create({
			key: 'dino-down-anim',
			frames: this.anims.generateFrameNumbers('dino-down', {
				start: 0,
				end: 1,
			}),
			frameRate: 10,
			repeat: -1,
		});

		this.anims.create({
			key: 'enemy-dino-fly',
			frames: this.anims.generateFrameNumbers('enemy-bird', {
				start: 0,
				end: 1,
			}),
			frameRate: 6,
			repeat: -1,
		});
	}

	handleScore() {
		this.time.addEvent({
			delay: 1000 / 10,
			loop: true,
			callbackScope: this,
			callback: () => {
				if (!this.isGameRunning) {
					return;
				}

				this.score++;
				this.gameSpeed += 0.01;

				if (this.score % 100 === 0) {
					this.reachSound.play();

					this.tweens.add({
						targets: this.scoreText,
						duration: 100,
						repeat: 3,
						alpha: 0,
						yoyo: true,
					});
				}

				const score = Array.from(String(this.score), Number);
				for (let i = 0; i < 5 - String(this.score).length; i++) {
					score.unshift(0);
				}

				this.scoreText.setText(score.join(''));
			},
		});
	}

	handleInputs() {
		this.restart.on('pointerdown', () => {
			this.dino.setVelocityY(0);
			if (this.dino.body instanceof Phaser.Physics.Arcade.Body) {
				this.dino.body.setSize(44, 92);
				this.dino.body.offset.y = 0;
			}
			this.physics.resume();
			this.obstacles.clear(true, true);
			this.isGameRunning = true;
			this.gameOverScreen.setAlpha(0);
			this.anims.resumeAll();
		});

		this.input.keyboard?.on('keydown-SPACE', () => {
			if (this.dino.body instanceof Phaser.Physics.Arcade.Body) {
				if (!this.dino.body.onFloor() || this.dino.body.velocity.x > 0) {
					return;
				}

				this.jumpSound.play();
				this.dino.body.setSize(44, 92);
				this.dino.body.offset.y = 0;
				this.dino.setVelocityY(-1600);
				this.dino.setTexture('dino', 0);
			}
		});

		this.input.keyboard?.on('keydown-DOWN', () => {
			if (this.dino.body instanceof Phaser.Physics.Arcade.Body) {
				if (!this.dino.body.onFloor() || !this.isGameRunning) {
					return;
				}

				this.dino.body.setSize(44, 58);
				this.dino.body.offset.y = 34;
			}
		});

		this.input.keyboard?.on('keyup-DOWN', () => {
			if (this.score !== 0 && !this.isGameRunning) {
				return;
			}

			if (this.dino.body instanceof Phaser.Physics.Arcade.Body) {
				this.dino.body.setSize(44, 92);
				this.dino.body.offset.y = 0;
			}
		});
	}

	placeObstacle() {
		const obstacleNum = Math.floor(Math.random() * 7) + 1;
		const distance = Phaser.Math.Between(600, 900);

		let obstacle;
		if (obstacleNum > 6) {
			const enemyHeight = [20, 50];
			obstacle = this.obstacles.create(
				(this.game.config.width as number) + distance,
				(this.game.config.height as number) -
					enemyHeight[Math.floor(Math.random() * 2)],
				'enemy-bird'
			);
			obstacle.play('enemy-dino-fly', true);
			if (obstacle.body instanceof Phaser.Physics.Arcade.Body) {
				obstacle.body.setSize(obstacle.width, obstacle.height / 1.5);
			}
		} else {
			obstacle = this.obstacles.create(
				(this.game.config.width as number) + distance,
				this.game.config.height as number,
				`obstacle-${obstacleNum}`
			);
			if (obstacle.body instanceof Phaser.Physics.Arcade.Body) {
				obstacle.body.offset.y = 10;
			}
		}

		obstacle.setOrigin(0, 1).setImmovable();
	}

	update(time: number, delta: number) {
		if (!this.isGameRunning) {
			return;
		}

		this.ground.tilePositionX += this.gameSpeed;
		Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);
		Phaser.Actions.IncX(this.environment.getChildren(), -0.5);

		this.respawnTime += delta * this.gameSpeed * 0.08;
		if (this.respawnTime >= 1500) {
			this.placeObstacle();
			this.respawnTime = 0;
		}

		this.obstacles
			.getChildren()
			.forEach((obstacle: Phaser.GameObjects.GameObject) => {
				if ((obstacle as Phaser.Physics.Arcade.Sprite).getBounds().right < 0) {
					this.obstacles.killAndHide(obstacle);
				}
			});

		this.environment
			.getChildren()
			.forEach((env: Phaser.GameObjects.GameObject) => {
				if ((env as Phaser.GameObjects.Image).getBounds().right < 0) {
					(env as Phaser.GameObjects.Image).x =
						(this.game.config.width as number) + 30;
				}
			});

		if (this.dino.body instanceof Phaser.Physics.Arcade.Body) {
			if (this.dino.body.deltaAbsY() > 0) {
				this.dino.anims.stop();
				this.dino.setTexture('dino', 0);
			} else {
				this.dino.body.height <= 58
					? this.dino.play('dino-down-anim', true)
					: this.dino.play('dino-run', true);
			}
		}
	}
}

export default PlayScene;
