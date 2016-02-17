"""empty message

Revision ID: 31b14999ff49
Revises: None
Create Date: 2016-02-04 18:12:28.736048

"""

# revision identifiers, used by Alembic.
revision = '31b14999ff49'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('tags',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=1024), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=64), nullable=True),
    sa.Column('realname', sa.String(length=64), nullable=True),
    sa.Column('password_hash', sa.String(length=128), nullable=True),
    sa.Column('confirmed', sa.Boolean(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('news',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=True),
    sa.Column('author_name', sa.String(length=64), nullable=True),
    sa.Column('context', sa.String(length=1024), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('modified_at', sa.DateTime(), nullable=True),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_news_created_at'), 'news', ['created_at'], unique=False)
    op.create_table('comments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('context', sa.String(length=1024), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('author_name', sa.String(length=64), nullable=True),
    sa.Column('news_id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['news_id'], ['news.id'], ),
    sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_created_at'), 'comments', ['created_at'], unique=False)
    op.create_table('tag_relationship',
    sa.Column('news_id', sa.Integer(), nullable=False),
    sa.Column('tags_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['news_id'], ['news.id'], ),
    sa.ForeignKeyConstraint(['tags_id'], ['tags.id'], ),
    sa.PrimaryKeyConstraint('news_id', 'tags_id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('tag_relationship')
    op.drop_index(op.f('ix_comments_created_at'), table_name='comments')
    op.drop_table('comments')
    op.drop_index(op.f('ix_news_created_at'), table_name='news')
    op.drop_table('news')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
    op.drop_table('tags')
    ### end Alembic commands ###
